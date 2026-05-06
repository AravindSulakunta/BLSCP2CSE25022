export const getPriority = (type) => {
  if (type === "Placement") return 3;
  if (type === "Result") return 2;
  return 1;
};