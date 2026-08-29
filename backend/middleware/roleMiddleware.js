const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    if (!req.admin || req.admin.role !== requiredRole) {
      return res.status(403).json({
        message: "Access denied. Admin permission required.",
      });
    }

    next();
  };
};

module.exports = roleMiddleware;