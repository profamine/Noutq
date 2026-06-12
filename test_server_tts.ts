async function test() {
  const res = await fetch('http://localhost:3000/api/tts?text=test&lang=ar');
  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("BODY:", text.substring(0, 100));
}
test();
