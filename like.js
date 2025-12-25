<div class="vote-widget">
  
  <button class="vote-btn like-btn" id="likeBtn">
    <div class="icon-layer">
      <svg viewBox="0 0 24 24" class="icon-default">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
      </svg>
      <div class="particles" id="likeParticles"></div>
    </div>
    <span class="count-ticker" id="likeCount">0</span>
  </button>

  <div class="separator"></div>

  <button class="vote-btn dislike-btn" id="dislikeBtn">
    <div class="icon-layer">
      <svg viewBox="0 0 24 24" class="icon-default">
        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
      </svg>
      <div class="particles" id="dislikeParticles"></div>
    </div>
    <span class="count-ticker" id="dislikeCount">0</span>
  </button>

</div>

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDY7Y4oWT6kanY1CAgtZwu6ZYsBuOIs9K4",
  authDomain: "scriptory-store.firebaseapp.com",
  projectId: "scriptory-store",
  storageBucket: "scriptory-store.firebasestorage.app",
  messagingSenderId: "573513081490",
  appId: "1:573513081490:web:224cdb71c548afbcd53c4b",
  databaseURL: "https://scriptory-store-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const postId = location.pathname.replace(/\W+/g, '_') || "home";
const voteKey = "vote_" + postId;
const ref = db.ref("posts/" + postId);

let currentVote = localStorage.getItem(voteKey) || null;
let isLocked = false;
let currentLikes = 0;
let currentDislikes = 0;

// Elements
const likeBtn = document.getElementById("likeBtn");
const dislikeBtn = document.getElementById("dislikeBtn");
const likeCountEl = document.getElementById("likeCount");
const dislikeCountEl = document.getElementById("dislikeCount");

// --- ANIMATION UTILS ---

// 1. Particle Explosion
function explodeParticles(containerId, color) {
  const container = document.getElementById(containerId);
  // Create 8 particles
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.backgroundColor = color;
    
    // Random direction
    const angle = (Math.random() * 360);
    const velocity = 20 + Math.random() * 20; 
    const tx = Math.cos(angle * Math.PI / 180) * velocity;
    const ty = Math.sin(angle * Math.PI / 180) * velocity;
    
    p.style.setProperty('--tx', `${tx}px`);
    p.style.setProperty('--ty', `${ty}px`);
    p.style.animation = `pop 0.6s cubic-bezier(0, .9, .57, 1) forwards`;
    
    container.appendChild(p);
    // Cleanup
    setTimeout(() => p.remove(), 600);
  }
}

// 2. Smooth Number Counter
function animateNumber(element, start, end) {
  if (start === end) return;
  const duration = 400;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out quart
    const ease = 1 - Math.pow(1 - progress, 4);
    
    const current = Math.floor(start + (end - start) * ease);
    element.innerText = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.innerText = end;
    }
  }
  requestAnimationFrame(update);
}

// --- LOGIC ---

// Initial Load
ref.on("value", snap => {
  const d = snap.val() || { likes: 0, dislikes: 0 };
  
  // Animate numbers only if changed
  animateNumber(likeCountEl, currentLikes, d.likes || 0);
  animateNumber(dislikeCountEl, currentDislikes, d.dislikes || 0);
  
  currentLikes = d.likes || 0;
  currentDislikes = d.dislikes || 0;
});

function updateUI() {
  // Toggle Classes
  likeBtn.classList.toggle("active", currentVote === "like");
  dislikeBtn.classList.toggle("active", currentVote === "dislike");
}
updateUI(); // Run once on load

// Handle Click
function handleVote(type) {
  if (isLocked) return;
  isLocked = true;
  setTimeout(() => isLocked = false, 1000); // Debounce

  // Trigger Animation if activating
  if (currentVote !== type) {
    if (type === 'like') explodeParticles('likeParticles', '#ec4899');
    if (type === 'dislike') explodeParticles('dislikeParticles', '#6366f1');
  }

  ref.transaction(d => {
    if (!d) d = { likes: 0, dislikes: 0 };
    
    // Sanitizing
    d.likes = Math.max(0, d.likes || 0);
    d.dislikes = Math.max(0, d.dislikes || 0);

    if (currentVote === type) {
      // Removing vote
      if (type === "like") d.likes--;
      if (type === "dislike") d.dislikes--;
      currentVote = null;
    } else {
      // Changing/Adding vote
      if (currentVote === "like") d.likes--;
      if (currentVote === "dislike") d.dislikes--;
      
      if (type === "like") d.likes++;
      if (type === "dislike") d.dislikes++;
      currentVote = type;
    }
    
    return d;
  }, (error, committed, snapshot) => {
    if (committed) {
      localStorage.setItem(voteKey, currentVote || "");
      updateUI();
    }
  });
}

// Bind Events
likeBtn.addEventListener('click', () => handleVote('like'));
dislikeBtn.addEventListener('click', () => handleVote('dislike'));
