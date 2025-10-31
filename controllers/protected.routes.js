

export async function home(req, res) {
    const { user } = req.session;
    if(!user) return res.status(403).send('Acces not authorized');

    res.render('protected', user) 
}