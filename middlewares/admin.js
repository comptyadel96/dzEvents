module.exports=function(req,res,next){
if(!req.user.isAdmin) return res.status(403).send('vous devez étre un administrateur pour faire cette action')
next()
}