
import axios from 'axios';

export async function fetchSlots(location) {
  try {
    const res = await axios.get(`${process.env.NEXTAUTH_URL}/api/slots?location=${location}`, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    console.log(`Server: Slots API response for ${location}:`, res.data);
    return res.data;
  } catch (err) {
    console.error(`Server: Failed to fetch slots for ${location}:`, {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw new Error(`Failed to load slots for ${location}`);
  }
}

export async function fetchWallet(email) {
  try {
    console.log(`Server: Fetching wallet for ${email} from ${process.env.NEXTAUTH_URL}/api/wallet/amount`);
    const res = await axios.get(`${process.env.NEXTAUTH_URL}/api/wallet/amount`, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    console.log(`Server: Wallet API response for ${email}:`, res.data);
    return res.data.balance;
  } catch (err) {
    console.error(`Server: Failed to fetch wallet for ${email}:`, {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw new Error('Failed to load wallet balance');
  }
}
