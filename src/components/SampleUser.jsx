import { getSampleUserData } from './auth';

export default function SampleUser(){
  const data = getSampleUserData();
  if (!data) return (
    <section style={{padding:20}}>No users registered yet.</section>
  );
  return (
    <section style={{padding:20}}>
      <h2>Sample User Data</h2>
      <div><strong>Name:</strong> {data.firstName} {data.lastName}</div>
      <div><strong>Email:</strong> {data.email}</div>
      <h3>Investments</h3>
      <ul>
        {data.investments.map(i=> (
          <li key={i.id}>{i.name} — {i.amount} on {i.date}</li>
        ))}
      </ul>
    </section>
  );
}
