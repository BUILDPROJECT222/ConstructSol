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
    description: 'An elegant residential property with premium amenities yielding top-tier rental income',
    price: 5000,
    reward: 1000,
    growthTime: 3600, // Construction time in seconds
  },
  {
    id: 'apartment',
    name: 'Sky Tower Residences',
    imgSrc: apartmentIcon,
    icon: <img src={apartmentIcon} alt="Apartment" width="70" height="70" />,
    description: 'A prestigious high-rise with panoramic views and luxury units commanding premium rents',
    price: 1000,
    reward: 1200,
    growthTime: 10, // 2 hours
  },
  {
    id: 'store',
    name: 'Boutique Emporium',
    imgSrc: storeIcon,
    icon: <img src={storeIcon} alt="Store" width="70" height="70" />,
    description: 'An upscale shopping destination featuring exclusive merchandise and a devoted clientele',
    price: 1000,
    reward: 1800,
    growthTime: 10, // 1.5 hours
  },
  {
    id: 'store1',
    name: 'Corner Marketplace',
    imgSrc: storeIcon1,
    icon: <img src={storeIcon1} alt="Store1" width="70" height="70" />,
    description: 'A strategically located mini-market with constant customer flow and high-margin impulse buys',
    price: 1000,
    reward: 1800,
    growthTime: 10, // 1.5 hours
  },
  {
    id: 'store2',
    name: 'Mega Mall Complex',
    imgSrc: storeIcon2,
    icon: <img src={storeIcon2} alt="Store2" width="70" height="70" />,
    description: 'A sprawling commercial paradise with entertainment venues, food courts and flagship stores',
    price: 1000,
    reward: 1800,
    growthTime: 15, // 1.5 hours
  },
  {
    id: 'factory',
    name: 'Tech Manufacturing Hub',
    imgSrc: factoryIcon,
    icon: <img src={factoryIcon} alt="Factory" width="70" height="70" />,
    description: 'A cutting-edge automated production facility operating 24/7 with minimal downtime for maximum profit',
    price: 20000,
    reward: 4000,
    growthTime: 10800, // 3 hours
  }
]; 
