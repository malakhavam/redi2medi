const withAuth = (req, res, next) => {
    // If the User is not logged in, redirect the User to the login page
    if (!req.session.loggedIn) {
      res.redirect('/login');
    } else {
      // If the User is logged in, execute the route function that will allow them to view the gallery
      // We call next() if the User is authenticated
      next();
    }
  };
  
  module.exports = withAuth;
  