import { AuctionFormFields } from './auction';

export function validateAuctionFields(form: AuctionFormFields): string[] {
  const errors: string[] = [];

  validateBasicFields(form, errors);
  validateBuyItNow(form, errors);
  validateCharity(form, errors);

  return errors;
}

function validateBasicFields(form: AuctionFormFields, errors: string[]) {
  if (!form.title) errors.push('Title is required.');
  if (!form.description) errors.push('Description is required.');
  if (!form.startingBid || form.startingBid < 0)
    errors.push('Starting bid must be a positive number.');
  if (!form.tags || form.tags.length === 0)
    errors.push('At least one tag is required.');
  if (!form.createdAt) errors.push('Creation date is required.');
  if (form.sellerId === undefined || form.sellerId === null)
    errors.push('Seller ID is required.');
}

function validateBuyItNow(form: AuctionFormFields, errors: string[]) {
  if (!form.buyItNow?.enabled) return;

  if (form.buyItNow.price === undefined || form.buyItNow.price <= 0)
    errors.push('Buy It Now price must be greater than zero.');
  if (!form.buyItNow.activatedAt)
    errors.push('Buy It Now activation date is required.');
}

function validateCharity(form: AuctionFormFields, errors: string[]) {
  if (!form.charity) return;

  if (!form.charity.organization)
    errors.push('Charity organization name is required.');
  const pct = form.charity.percentage;
  if (pct === undefined || pct < 1 || pct > 100)
    errors.push('Charity percentage must be between 1 and 100.');
}
