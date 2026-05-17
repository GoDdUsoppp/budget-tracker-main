export const formatCurrency = (amount) => {
  const currencyCode = localStorage.getItem("currency") || "INR";

  const locales = {
    INR: "en-IN",
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB",
  };

  const locale = locales[currencyCode] || "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};
