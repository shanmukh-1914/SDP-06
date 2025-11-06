import { useState } from 'react';

export default function Support(){
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <section style={{padding:'2rem'}}>
      <h2>Support</h2>
      <p>If you need help, leave a short message and we'll respond in the demo environment.</p>
      <form onSubmit={(e)=>{ e.preventDefault(); setSent(true); }}>
        <div style={{maxWidth:480}}>
          <label>Message</label>
          <textarea value={msg} onChange={(e)=>setMsg(e.target.value)} rows={4} style={{width:'100%'}} required/>
          <button style={{marginTop:8}} type="submit">Send</button>
        </div>
      </form>
      {sent && <p style={{color:'#0b8457'}}>Message sent (demo)</p>}
    </section>
  );
}
