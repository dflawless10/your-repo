import {useState} from "react";

const [showGoat, setShowGoat] = useState(false);

const handleBidConfirm = () => {
  // your bid logic...
  setShowGoat(true);
  setTimeout(() => setShowGoat(false), 2000); // hide after animation
if (showGoat) return;
};
export default handleBidConfirm;