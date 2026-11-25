import { expect, test } from '../fixtures';

test.describe('Checkout', () => {
  test.beforeEach(async ({ shop }) => {
    await shop.goto();
    await shop.add({ drink: 'Brown Sugar Fresh Milk', toppings: ['Black pearls'] });
  });

  test('missing details are pointed out field by field', async ({ drawer }) => {
    await drawer.open();
    await drawer.checkout({ name: '', mobile: '12345', address: 'short' });

    await expect(drawer.root.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
    await expect(drawer.root.getByText('Enter the name for the order.')).toBeVisible();
    await expect(drawer.root.getByText('Enter a mobile number like 0917 123 4567.')).toBeVisible();
    await expect(drawer.root.getByText('Enter a delivery address with street and barangay.')).toBeVisible();
    await expect(drawer.receipt).toHaveCount(0);
  });

  test('placing a delivery order shows a receipt and empties the order @smoke', async ({ shop, drawer }) => {
    await drawer.open();
    await drawer.checkout({ name: 'Akinon', mobile: '+63 917 123 4567', address: '12 Mabini St, Brgy San Roque, Tarlac City' });

    await expect(drawer.receipt).toContainText(/Order BB-\d{4}/);
    await expect(drawer.receipt).toContainText('Salamat, Akinon!');
    await expect(drawer.receipt).toContainText('1 × Brown Sugar Fresh Milk');
    await expect(drawer.receipt).toContainText('₱193.00'); // 144 + 49
    await expect(drawer.receipt).toContainText('Delivering to 12 Mabini St, Brgy San Roque, Tarlac City');
    await expect(shop.cartCount).toHaveText('0');

    await drawer.root.getByRole('button', { name: 'Start a new order' }).click();
    await drawer.open();
    await expect(drawer.root.getByText('Your order is empty.')).toBeVisible();
  });

  test('pickup needs no address', async ({ drawer }) => {
    await drawer.open();
    await drawer.fulfil('Pickup');
    await drawer.checkout({ name: 'Akinon', mobile: '0917-123-4567' });
    await expect(drawer.receipt).toContainText('Ready for pickup in about 15 minutes');
  });
});
