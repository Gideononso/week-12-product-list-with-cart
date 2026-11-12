import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import products from '../data.json';
import './style.css';

const CART_KEY = 'dessert-shop-cart';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(CART_KEY));

    return Object.fromEntries(
      products
        .map(({ name }) => [name, savedCart?.[name]])
        .filter(([, quantity]) => Number.isSafeInteger(quantity) && quantity > 0)
    );
  } catch {
    return {};
  }
}

function assetPath(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\.\//, '')}`;
}

function ProductCard({ product, quantity, onChangeQuantity }) {
  const { name, category, price, image } = product;

  return (
    <article>
      <picture>
        <source media="(min-width: 900px)" srcSet={assetPath(image.desktop)} />
        <source media="(min-width: 600px)" srcSet={assetPath(image.tablet)} />
        <img src={assetPath(image.mobile)} alt={name} />
      </picture>

      <p>{category}</p>
      <h2>{name}</h2>
      <p>{currency.format(price)}</p>

      {quantity === 0 ? (
        <button
          type="button"
          onClick={() => onChangeQuantity(name, 1)}
          aria-label={`Add ${name} to cart`}
        >
          Add to Cart
        </button>
      ) : (
        <div role="group" aria-label={`Quantity for ${name}`}>
          <button
            type="button"
            onClick={() => onChangeQuantity(name, -1)}
            aria-label={`Decrease quantity of ${name}`}
          >
            −
          </button>
          {' '}{quantity}{' '}
          <button
            type="button"
            onClick={() => onChangeQuantity(name, 1)}
            aria-label={`Increase quantity of ${name}`}
          >
            +
          </button>
        </div>
      )}
    </article>
  );
}

function Cart({ items, itemCount, total, onRemove, onClear, onConfirm }) {
  return (
    <aside className="cart" aria-labelledby="cart-title">
      <h2 id="cart-title" aria-live="polite">Your Cart ({itemCount})</h2>

      {items.length === 0 ? (
        <p>Your added items will appear here.</p>
      ) : (
        <>
          <ul>
            {items.map(({ name, price, quantity, subtotal }) => (
              <li key={name}>
                <p>
                  <strong>{name}</strong><br />
                  {quantity} × {currency.format(price)} = {currency.format(subtotal)}
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(name)}
                  aria-label={`Remove ${name} from cart`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <p><strong>Order Total: {currency.format(total)}</strong></p>
          <button type="button" onClick={onConfirm}>Confirm Order</button>
          {' '}
          <button type="button" onClick={onClear}>Clear Cart</button>
        </>
      )}
    </aside>
  );
}

function App() {
  const [cart, setCart] = useState(loadCart);
  const confirmationRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
      console.warn('Could not save the cart.', error);
    }
  }, [cart]);

  function changeQuantity(name, amount) {
    setCart((previousCart) => {
      const nextCart = { ...previousCart };
      const quantity = (nextCart[name] ?? 0) + amount;

      if (quantity > 0) {
        nextCart[name] = quantity;
      } else {
        delete nextCart[name];
      }

      return nextCart;
    });
  }

  function removeItem(name) {
    setCart((previousCart) => {
      const nextCart = { ...previousCart };
      delete nextCart[name];
      return nextCart;
    });
  }

  function clearCart() {
    setCart({});
  }

  const items = products
    .filter(({ name }) => cart[name] > 0)
    .map((product) => ({
      ...product,
      quantity: cart[product.name],
      subtotal: product.price * cart[product.name],
    }));

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <main className="shop-layout">
      <section aria-labelledby="desserts-title">
        <h1 id="desserts-title">Desserts</h1>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.name}
              product={product}
              quantity={cart[product.name] ?? 0}
              onChangeQuantity={changeQuantity}
            />
          ))}
        </div>
      </section>

      <Cart
        items={items}
        itemCount={itemCount}
        total={total}
        onRemove={removeItem}
        onClear={clearCart}
        onConfirm={() => confirmationRef.current.showModal()}
      />

      <dialog
        ref={confirmationRef}
        aria-labelledby="confirmation-title"
        onCancel={(event) => event.preventDefault()}
      >
        <h2 id="confirmation-title">Order Confirmed</h2>
        <p>We hope you enjoy your desserts!</p>

        <ul>
          {items.map(({ name, quantity, subtotal }) => (
            <li key={name}>
              {quantity} × {name} — {currency.format(subtotal)}
            </li>
          ))}
        </ul>

        <p><strong>Order Total: {currency.format(total)}</strong></p>

        <button
          type="button"
          onClick={() => {
            confirmationRef.current.close();
            clearCart();
          }}
        >
          Start New Order
        </button>
      </dialog>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);