
import express from 'express'
import jwt from 'jsonwebtoken'
// los secret
import { ACCESS_SECRET, REFRES_SECRET } from '../config.js'
import { UserRepository } from '../user-repository.js'
// agrupo mis endpoints
const router = express.Router();
// ruta por defecto
router.get('/', (request, response) => { // request (que recibe) response (que devolvera)
  const { user } = request.session
  response.render('index', user) // renderiza el index
})
// endpoint de logueo
router.post('/login', async (req,res)=>  {
  const { username, password } = req.body;

  try{
    const user = await UserRepository.login({username, password})
    // creo los tokens
    const token = jwt.sign({ id: user._id, username: user.username}, ACCESS_SECRET, {expiresIn: '5m'})
    const refreshToken = jwt.sign({ id: user._id, username: user.username}, REFRES_SECRET, { expiresIn: '7d'})
    //si todo sale bien, los agrego en cookies
    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 5, // 5 minutos
      })
      .cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
      })
      //retorno el usuario y sus cookies
      .send({ user, token, refreshToken }) 
      //guardo el token refrescado
      await UserRepository.saveRefreshToken({ userId: user._id, token: refreshToken});
  } catch (error) {
    // caso de error, devuelvo 401
    res.status(401).send(error.message)
  }

})

router.post('/register', async (req,res)=>  {
  const { username, password } = req.body
 
  try{
    const id = await UserRepository.create({username, password})
    res.send({ id })
  } catch (error) {
    res.status(400).send(error.message);
  }

})

router.post('/logout', async (req, res) => {
  //borro las cookies si me salgo
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) return res.status(401).send('No refresh token provided');

  try {
    const { id } = jwt.verify(refreshToken, REFRES_SECRET);
    await UserRepository.deleteRefreshToken(id); // opcional
  } catch {}
  
  // limpio las cookies
  res
    .clearCookie('access_token')
    .clearCookie('refresh_token')
    .status(200)
    .json({ message: 'Logout successful' });
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) return res.status(401).send('No refresh token provided');

  try {
    // si se verifica devuelve un objeto con id
    const userData = jwt.verify(refreshToken, REFRES_SECRET);

    const storedToken = await UserRepository.getRefreshToken({ userId: userData.id});
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
});

const authRoutes = router

export default authRoutes 