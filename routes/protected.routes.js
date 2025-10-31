import express from 'express'

const router = express.Router();

router.get('/protected', (req,res) => {
  const { user } = req.session;
  if(!user) return res.status(403).send('Acces not authorized');

  res.render('protected', user) 

})

const protectedRoutes = router;

export default protectedRoutes;