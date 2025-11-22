import React from 'react';
import Signup from './Signup';

// Render the same Signup component but in admin mode
export default function AdminSignup(){
  return <Signup isAdmin={true} />;
}
