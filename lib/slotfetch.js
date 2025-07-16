
import axios from 'axios';

export async function fetchSlots(location) {
  try {
    const res = await axios.get(`${process.env.NEXTAUTH_URL}/api/slots?location=${location}`, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error(`Server: Failed to fetch slots for ${location}:`, err);
    throw new Error(`Failed to load slots for ${location}`);
  }
}

export async function fetchWallet(email) {
  try {
    const res = await axios.get(`${process.env.NEXTAUTH_URL}/api/wallet/amount`, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    return res.data.balance;
  } catch (err) {
    console.error(`Server: Failed to fetch wallet for ${email}:`, err);
    throw new Error('Failed to load wallet balance');
  }
}
