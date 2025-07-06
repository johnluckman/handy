export interface Denomination {
  id: string;
  label: string;
  value: number;
  type: 'note' | 'coin';
  image: any; // React Native image require
  targetFloat: number;
}

export const denominations: Denomination[] = [
  { id: '100', label: '$100', value: 100, type: 'note', image: require('../assets/denominations/100.png'), targetFloat: 0 },
  { id: '50', label: '$50', value: 50, type: 'note', image: require('../assets/denominations/50.png'), targetFloat: 1 },
  { id: '20', label: '$20', value: 20, type: 'note', image: require('../assets/denominations/20.png'), targetFloat: 5 },
  { id: '10', label: '$10', value: 10, type: 'note', image: require('../assets/denominations/10.png'), targetFloat: 10 },
  { id: '5', label: '$5', value: 5, type: 'note', image: require('../assets/denominations/5.png'), targetFloat: 10 },
  { id: '2', label: '$2', value: 2, type: 'coin', image: require('../assets/denominations/2.png'), targetFloat: 10 },
  { id: '1', label: '$1', value: 1, type: 'coin', image: require('../assets/denominations/1.png'), targetFloat: 10 },
  { id: '0.50', label: '50c', value: 0.50, type: 'coin', image: require('../assets/denominations/0.50.png'), targetFloat: 10 },
  { id: '0.20', label: '20c', value: 0.20, type: 'coin', image: require('../assets/denominations/0.20.png'), targetFloat: 10 },
  { id: '0.10', label: '10c', value: 0.10, type: 'coin', image: require('../assets/denominations/0.10.png'), targetFloat: 10 },
  { id: '0.05', label: '5c', value: 0.05, type: 'coin', image: require('../assets/denominations/0.05.png'), targetFloat: 10 },
]; 

export function calculateTotalDeposit(row: any): number {
  const denominationDefs = [
    { key: '100', value: 100 },
    { key: '50', value: 50 },
    { key: '20', value: 20 },
    { key: '10', value: 10 },
    { key: '5', value: 5 },
    { key: '2', value: 2 },
    { key: '1', value: 1 },
    { key: '0.50', value: 0.5 },
    { key: '0.20', value: 0.2 },
    { key: '0.10', value: 0.1 },
    { key: '0.05', value: 0.05 },
  ];
  let total = 0;
  denominationDefs.forEach(denom => {
    const deposited = Number(row[`${denom.key}_Deposited`] || 0);
    total += deposited * denom.value;
  });
  return total;
} 