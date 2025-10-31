import express from 'express'
import { PORT, ACCESS_SECRET, REFRES_SECRET } from './config.js'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { UserModel } from './models/user.js'
import authRoutes from './routes/auth.routes.js'
import protectedRoutes from './routes/protected.routes.js'


// creo app de express
const app = express()
// renderizo con ejs
app.set('view engine', 'ejs')
// middleware para poder leer los json de los body de los endpoints
app.use(express.json()) 
//usar cookies
app.use(cookieParser())


app.use(async (req, res, next) => {
  const token = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;
  // inicializo con usuario nulo
  req.session = { user: null };

  if (!token) return next();

  try {
    // verifico que tenga el secret correcto
    const data = jwt.verify(token, ACCESS_SECRET);
    // obtengo usuario
    req.session.user = data;
    return next();
  } catch (error) {
    // Si el token expiró, intentamos renovar
    if (error.name === 'TokenExpiredError' && refreshToken) {
      try {
        const userData = jwt.verify(refreshToken, REFRES_SECRET);
        const storedToken = await UserModel.getRefreshToken({ userId: userData.id });

        if (storedToken === refreshToken) {
          const newAccessToken = jwt.sign(
            { id: userData.id, username: userData.username },
            ACCESS_SECRET,
            { expiresIn: '5m' }
          );

          res.cookie('access_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 5, // 5 minutos
          });

          req.session.user = { id: userData.id, username: userData.username };
        }
      } catch (refreshError) {
        // refresh token inválido o expirado
        throw new Error('Error with the refresh token')
      }
    }
    return next();
  }
});

// utilizo las rutas en su respectivo path
app.use('/', authRoutes)
app.use('/protected', protectedRoutes)


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
