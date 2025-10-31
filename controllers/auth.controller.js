import jwt from 'jsonwebtoken';
import { ACCESS_SECRET, REFRES_SECRET } from '../config.js';
import { UserModel } from '../models/user.js';

export async function home(req, res) {
    const { user } = req.session
    res.render('index', user) // renderiza el index
}

export async function login(req, res) {
  const { username, password } = req.body;

  try {
    const user = await UserModel.login({ username, password });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      ACCESS_SECRET,
      { expiresIn: '5m' }
    );

    const refreshToken = jwt.sign(
      { id: user._id, username: user.username },
      REFRES_SECRET,
      { expiresIn: '7d' }
    );

    await UserModel.saveRefreshToken({ userId: user._id, token: refreshToken });

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 5,
      })
      .cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      })
      .send({ user, token, refreshToken });
  } catch (error) {
    res.status(401).send(error.message);
  }
}

export async function register(req, res) {
    const { username, password } = req.body
 
  try{
    const id = await UserModel.create({username, password})
    res.send({ id })
  } catch (error) {
    res.status(400).send(error.message);
  }
}

export async function logout(req, res) {
  //borro las cookies si me salgo
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) return res.status(401).send('No refresh token provided');

  try {
    const { id } = jwt.verify(refreshToken, REFRES_SECRET);
    await UserModel.deleteRefreshToken(id); // opcional
  } catch {}
  
  // limpio las cookies
  res
    .clearCookie('access_token')
    .clearCookie('refresh_token')
    .status(200)
    .json({ message: 'Logout successful' });
}

export async function refresh(req,res) {
      const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) return res.status(401).send('No refresh token provided');

  try {
    // si se verifica devuelve un objeto con id
    const userData = jwt.verify(refreshToken, REFRES_SECRET);

    const storedToken = await UserModel.getRefreshToken({ userId: userData.id});
    // si ambos token son diferentes
    if (storedToken !== refreshToken) {
      return res.status(403).send('Invalid refresh token');
    }
    // creo nuevo token
    const newAccessToken = jwt.sign(
      { id: userData.id, username: userData.username },
      ACCESS_SECRET,
      { expiresIn: '5m' }
    );
    // guardo nuevo token en cookie
    res
      .cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 5, // 5 minutos
      })
      .send({ message: 'Access token refreshed' });
  } catch (error) {
    res.status(403).send('Invalid or expired refresh token');
  }
}
