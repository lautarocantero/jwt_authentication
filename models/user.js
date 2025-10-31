import DBLocal from 'db-local';
import crypto from "crypto";
import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../config.js';

const { Schema } = new DBLocal({ path: './db'});

// el shcema es basicamente una interfaz, referencia para la en bd
const User = Schema('User', {
    _id: { type: String, required: true},
    username: { type: String, required: true },
    password: {type: String, required: true},
    refreshToken: { type: String, required: false},
})
// modelo con las acciones static que utilizaran los endpoints
export class UserModel {
    static async create ({ username, password }) {
        // validaciones
        Validation.username(username);
        Validation.password(password);

        // asegurar que el username no existe

        const user = User.findOne({ username });
        if (user) throw new Error('username already exists');

        // id que no se repite (baja posibilidad)
        const id = crypto.randomUUID();
        // guardo el password con hash
        //  .hash devuelve una promesa agrego await, para evitar bloquear el thread 
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        //creo el usuario con la info
        User.create({
            _id: id,
            username,
            password : hashedPassword,
        }).save()

        return id   

    }

    static async login ({ username, password }) { 
        //validacion
        Validation.username(username);
        Validation.password(password);
        // hago login solo si existe uno con el mismo name
        const user = User.findOne({ username });
        if(!user) throw new Error('username does not exist');  
        // hasheo la password que ingrego, para compararla con la password hasheada que tengo registrada
        const isValid = await bcrypt.compare (password, user.password);
        if(!isValid) throw new Error('password is invalid');
        // esto es para quitarle propiedades a un objeto
        const { password: _, ...publicUser } = user

        return publicUser;
    } 

    static async saveRefreshToken ({userId, token}) {
        //busco el usuario
        const user = User.findOne({ _id: userId });
        if (!user) throw new Error('User not found');
        // refresco el token 
        user.refreshToken = token;
        user.save();
    }

    static async getRefreshToken({userId}){
        const user = User.findOne({ _id: userId });
        return user?.refreshToken;
    }

    static async deleteRefreshToken({userId}) {
        const user = User.findOne({ _id: userId});
        if(!user) return;

        user.refreshToken = null;
        user.save();
    }

}
// validaciones que utilizan las acciones static
class Validation {
    static username (username) {
        if(typeof username !== 'string') throw new Error('username must be a string')
        if(username.length < 3) throw new Error('username must be at least 3 characters long')
    }

    static password (password) {
        if(typeof password !== 'string') throw new Error('password must be a string');
        if(password.length < 6) throw new Error('password must be at least 6 characters long')
    }

}
 
 