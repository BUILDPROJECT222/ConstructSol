import houseIcon from '../../assets/house.png';
import apartmentIcon from '../../assets/apartment.png';
import storeIcon from '../../assets/store.png';
import storeIcon1 from '../../assets/store1.png';
import storeIcon2 from '../../assets/store2.png';
import factoryIcon from '../../assets/factory.png';

export const seeds = [
  {
    id: 'house',
    name: 'Luxury Villa',
    imgSrc: houseIcon,
    icon: <img src={houseIcon} alt="House" width="70" height="70" />,
    description: 'High-end residential income boost',
    price: 50000,
    reward: 52500,
    growthTime: 10800, // Construction time in seconds
  },
  {
    id: 'apartment',
    name: 'Sky Tower Residences',
    imgSrc: apartmentIcon,
    icon: <img src={apartmentIcon} alt="Apartment" width="70" height="70" />,
    description: 'Vertical housing, stable returns',
    price: 50000,
    reward: 57500,
    growthTime: 21600, // 1.5 hours
  },
  {
    id: 'store',
    name: 'Boutique Emporium',
    imgSrc: storeIcon,
    icon: <img src={storeIcon} alt="Store" width="70" height="70" />,
    description: 'Small shop, fast revenue',
    price: 50000,
    reward: 70000,
    growthTime: 43200, 
  },
  {
    id: 'store1',
    name: 'Corner Marketplace',
    imgSrc: storeIcon1,
    icon: <img src={storeIcon1} alt="Store1" width="70" height="70" />,
    description: 'Compact business, consistent flow',
    price: 50000,
    reward: 95000,
    growthTime: 86400, 
  },
  {
    id: 'store2',
    name: 'Mega Mall Complex',
    imgSrc: storeIcon2,
    icon: <img src={storeIcon2} alt="Store2" width="70" height="70" />,
    description: 'Large-scale income generator',
    price: 50000,
    reward: 150000,
    growthTime: 172800, // 1.5 hours
  },
  // {
  //   id: 'factory',
  //   name: 'Tech Manufacturing Hub',
  //   imgSrc: factoryIcon,
  //   icon: <img src={factoryIcon} alt="Factory" width="70" height="70" />,
  //   description: 'A cutting-edge automated production facility operating 24/7 with minimal downtime for maximum profit',
  //   price: 20000,
  //   reward: 4000,
  //   growthTime: 10800, // 3 hours
  // }
]; 
