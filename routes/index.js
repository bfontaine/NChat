
/*
 * GET home page.
 */

exports.index = function(req, res){

  res.set('X-Powered-By', 'Electricity');

  res.render('index', {
      title: 'NChat'
  });
};
