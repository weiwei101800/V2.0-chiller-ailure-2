// src/components/InputPanel/validateForm.js
export default function validateForm(v) {
  const errs = [];
  if (v.Q_total <= 0) errs.push("Q_total 必须 > 0");
  if (v.alpha < 0 || v.alpha > 1) errs.push("α 必须在 0-1 之间");
  // …继续加校验规则
  return errs;
}
