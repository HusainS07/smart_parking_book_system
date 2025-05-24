import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-[#0c4a6e] to-[#01203c] text-white py-10 px-5 mt-16 rounded-t-3xl">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-around gap-8 text-left">
        
        {/* Contact Section */}
        <div className="flex-1 min-w-[250px] max-w-xs">
          <h4 className="text-lg font-bold text-white-400 mb-3">Contact Us</h4>
          <p>Phone: +91 9763542316</p>
          <p>Email: <a href="mailto:smartpark@gmail.com" className="text-blue-200 hover:underline">smartpark@gmail.com</a></p>
          <p>Contact No: +91 4321876543</p>
        </div>

        {/* System Links */}
        <div className="flex-1 min-w-[250px] max-w-xs">
          <h4 className="text-lg font-bold text-white-400 mb-3">A Complete System</h4>
          <ul className="list-none space-y-1">
            <li>Availability</li>
            <li>SmartPay</li>
            <li>Parking Controllers</li>
            <li>Users</li>
          </ul>
        </div>

        {/* Group Members */}
        <div className="flex-1 min-w-[250px] max-w-xs">
          <h4 className="text-lg font-bold text-white-400 mb-3">Group Members</h4>
          <ul className="list-none space-y-1">
            <li>Sakshi Mahale</li>
            <li>Bhakti Baraf</li>
            <li>Husain Sakarwala</li>
            <li>Aditya Kulkarni</li>
            <li>Akash Patil</li>
          </ul>
        </div>

      </div>

      <div className="text-center text-sm text-gray-300 mt-10">
        &copy; {new Date().getFullYear()} SmartPark | All rights reserved
      </div>
    </footer>
  );
};

export default Footer;
