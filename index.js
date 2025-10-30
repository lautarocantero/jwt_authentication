import express from 'express'
import { PORT, ACCESS_SECRET, REFRES_SECRET } from './config.js'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { UserRepository } from './user-repository.js'

const app = express()

app.set('view engine', 'ejs')
app.use(express.json()) 
app.use(cookieParser())

app.use(async (req, res, next) => {
  const token = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;
  req.session = { user: null };

  if (!token) return next();

  try {
    const data = jwt.verify(token, ACCESS_SECRET);
    req.session.user = data;
    return next();
  } catch (error) {
    // Si el token expiró, intentamos renovar
    if (error.name === 'TokenExpiredError' && refreshToken) {
      try {
        const userData = jwt.verify(refreshToken, REFRES_SECRET);
        const storedToken = await UserRepository.getRefreshToken({ userId: userData.id });

        if (storedToken === refreshToken) {
          const newAccessToken = jwt.sign(
            { id: userData.id, username: userData.username },
            ACCESS_SECRET,
            { expiresIn: '1h' }
          );

          res.cookie('access_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60,
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

app.get('/', (request, response) => {
  const { user } = request.session
  response.render('index', user)
})
  
app.post('/login', async (req,res)=>  {
  const { username, password } = req.body;

  try{
    const user = await UserRepository.login({username, password})
    const token = jwt.sign({ id: user._id, username: user.username}, ACCESS_SECRET, {expiresIn: '1m'})
    const refreshToken = jwt.sign({ id: user._id, username: user.username}, REFRES_SECRET, { expiresIn: '7d'})

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60, // 2 minutos
      })
      .cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
      })
      .send({ user, token, refreshToken }) 
      await UserRepository.saveRefreshToken({ userId: user._id, token: refreshToken});
  } catch (error) {
    res.status(401).send(error.message)
  }

})

app.post('/register', async (req,res)=>  {
  const { username, password } = req.body
 
  try{
    const id = await UserRepository.create({username, password})
    res.send({ id })
  } catch (error) {
    res.status(400).send(error.message);
  }

})

app.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) return res.status(401).send('No refresh token provided');

  try {
    const { id } = jwt.verify(refreshToken, REFRES_SECRET);
    await UserRepository.deleteRefreshToken(id); // opcional
  } catch {}
  

  res
    .clearCookie('access_token')
    .clearCookie('refresh_token')
    .json({ message: 'Logout successful' });
});

app.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) return res.status(401).send('No refresh token provided');

  try {
    const userData = jwt.verify(refreshToken, REFRES_SECRET);

    const storedToken = await UserRepository.getRefreshToken({ userId: userData.id});
    if (storedToken !== refreshToken) {
      return res.status(403).send('Invalid refresh token');
    }

    const newAccessToken = jwt.sign(
      { id: userData.id, username: userData.username },
      REFRES_SECRET,
      { expiresIn: '1h' }
    );

    res
      .cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60,
      })
      .send({ message: 'Access token refreshed' });
  } catch (error) {
    res.status(403).send('Invalid or expired refresh token');
  }
});

app.get('/protected', (req,res) => {

  const { user } = req.session;
  if (!user) return res.status(403).send('Acces not authorized');

  res.render('protected', user )
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
