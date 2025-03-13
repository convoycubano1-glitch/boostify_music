// This file is used to tell TypeScript that .tsx files can use JSX
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}