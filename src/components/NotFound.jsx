import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section style={{padding:'4rem 1rem', textAlign:'center'}}>
      <h1 style={{fontSize:'3rem', marginBottom:'1rem'}}>404</h1>
      <p>Page not found.</p>
      <Link to="/" style={{color:'#22c55e', fontWeight:600}}>Go Home</Link>
    </section>
  );
}
