import React from 'react';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { ProductProvider } from './src/context/ProductContext';
import ProductViewScreen from './src/screens/ProductViewScreen';

const ProductViewEntry = () => (
  <ThemeProvider>
    <ProductProvider>
      <ProductViewScreen />
    </ProductProvider>
  </ThemeProvider>
);

export default ProductViewEntry; 