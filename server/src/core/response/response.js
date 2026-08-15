export const successResponse = (
  res,
  data = null,
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const createdResponse = (
  res,
  data = null,
  message = "Created successfully"
) => {
  return successResponse(res, data, message, 201);
};