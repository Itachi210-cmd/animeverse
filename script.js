let allAnimeData = [];
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

function loadWatchlist() {
    const storedWatchlist = localStorage.getItem('animeWatchlist');
    return storedWatchlist ? JSON.parse(storedWatchlist) : [];
}

function saveWatchlist() {
    localStorage.setItem('animeWatchlist', JSON.stringify(watchlist));
    updateWatchlistDisplay();
}

async function fetchAnimeById(mal_id) {
    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${mal_id}`);
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching anime details:', error);
        return null;
    }
}

function showNotification(message, type = 'success') {
    const container = document.querySelector('.notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function addToWatchlist(anime) {
    const isAlreadyAdded = watchlist.some(item => item.id === anime.id);
    
    if (!isAlreadyAdded) {
        watchlist.push(anime);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        updateWatchlistDisplay();
        showNotification(`${anime.title} added to watchlist successfully!`);
    } else {
        showNotification(`${anime.title} is already in your watchlist!`, 'error');
    }
}

function removeFromWatchlist(animeId) {
    watchlist = watchlist.filter(item => item.id !== animeId);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    updateWatchlistDisplay();
    showNotification('Anime removed from watchlist successfully!');
}

function updateWatchlistDisplay() {
    const watchlistGrid = document.querySelector('.watchlist-grid');
    const watchlistEmpty = document.getElementById('watchlist-empty');
    
    if (!watchlistGrid) return;
    
    if (watchlist.length === 0) {
        watchlistEmpty.style.display = 'block';
        watchlistGrid.innerHTML = '';
        return;
    }
    
    watchlistEmpty.style.display = 'none';
    watchlistGrid.innerHTML = '';
    
    watchlist.forEach(anime => {
        const animeCard = document.createElement('div');
        animeCard.className = 'watchlist-item';
        animeCard.innerHTML = `
            <img src="${anime.image}" alt="${anime.title}" />
            <h4>${anime.title}</h4>
            <button class="remove-from-watchlist" onclick="removeFromWatchlist(${anime.id})">
                <i class="fas fa-times"></i>
            </button>
        `;
        watchlistGrid.appendChild(animeCard);
    });
}

async function fetchTopAnime(type = '') {
    const animeGrid = document.querySelector('.anime-grid');
    animeGrid.innerHTML = '<p>Loading top anime...</p>';

    let url = 'https://api.jikan.moe/v4/top/anime?limit=25';
    if (type) {
        url += `&type=${type}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        allAnimeData = data.data;

        displayAnime(allAnimeData);
    } catch (error) {
        animeGrid.innerHTML = '<p>Failed to load anime.</p>';
        console.error(error);
    }
}

function displayAnime(animeList) {
    const animeGrid = document.querySelector('.anime-grid');
    if (!animeGrid) return;
    
    animeGrid.innerHTML = '';
    
    animeList.forEach(anime => {
        const animeCard = document.createElement('div');
        animeCard.className = 'anime-card';
        animeCard.innerHTML = `
            <img src="${anime.images.jpg.image_url}" alt="${anime.title}" />
            <h3>${anime.title}</h3>
            <p>Score: ${anime.score || 'N/A'}</p>
            <button class="add-to-watchlist-btn" onclick="addToWatchlist({
                id: ${anime.mal_id},
                title: '${anime.title.replace(/'/g, "\\'")}',
                image: '${anime.images.jpg.image_url}'
            })">
                <i class="fas fa-plus"></i> Add to Watchlist
            </button>
        `;
        animeGrid.appendChild(animeCard);
    });
}

async function fetchUpcomingAnime() {
    const calendarGrid = document.querySelector('.calendar-grid');
    calendarGrid.innerHTML = '<p>Loading upcoming anime...</p>';

    try {
        const now = new Date();
        const year = now.getFullYear();
        const season = getSeason(now.getMonth()); // Helper function to get the current season

        const url = `https://api.jikan.moe/v4/seasons/${year}/${season}`;
        const response = await fetch(url);
        const data = await response.json();
        displayUpcomingAnime(data.data);
    } catch (error) {
        calendarGrid.innerHTML = '<p>Failed to load upcoming anime.</p>';
        console.error(error);
    }
}

function getSeason(month) {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
}

function displayUpcomingAnime(animeList) {
    const calendarGrid = document.querySelector('.calendar-grid');
    calendarGrid.innerHTML = '';

    if (animeList.length === 0) {
        calendarGrid.innerHTML = '<p>No upcoming anime found for this season.</p>';
        return;
    }

    animeList.forEach(anime => {
        const animeCard = document.createElement('div');
        animeCard.classList.add('upcoming-anime-card');

        const title = document.createElement('h3');
        title.textContent = anime.title;

        const image = document.createElement('img');
        image.src = anime.images.jpg.image_url;
        image.alt = anime.title;

        const details = document.createElement('div');
        details.classList.add('anime-details');

        let broadcastDay = 'Not available';
        let broadcastTime = 'Not available';
        if (anime.broadcast && anime.broadcast.day && anime.broadcast.time) {
            broadcastDay = anime.broadcast.day;
            broadcastTime = anime.broadcast.time;
        }

        const broadcastInfo = document.createElement('p');
        broadcastInfo.textContent = `Broadcast: ${broadcastDay} at ${broadcastTime} (JST)`;

        details.appendChild(broadcastInfo);
        animeCard.appendChild(image);
        animeCard.appendChild(title);
        animeCard.appendChild(details);
        calendarGrid.appendChild(animeCard);
    });
}

async function fetchAnimeRankings() {
    const rankingsGrid = document.querySelector('.rankings-grid');
    rankingsGrid.innerHTML = '<p>Loading anime rankings...</p>';

    try {
        const url = 'https://api.jikan.moe/v4/top/anime';
        const response = await fetch(url);
        const data = await response.json();
        displayAnimeRankings(data.data);
    } catch (error) {
        rankingsGrid.innerHTML = '<p>Failed to load anime rankings.</p>';
        console.error(error);
    }
}

function displayAnimeRankings(animeList) {
    const rankingsGrid = document.querySelector('.rankings-grid');
    rankingsGrid.innerHTML = '';

    if (animeList.length === 0) {
        rankingsGrid.innerHTML = '<p>No anime rankings found.</p>';
        return;
    }

    animeList.forEach((anime, index) => {
        const rankingCard = document.createElement('div');
        rankingCard.classList.add('ranking-card');

        const rank = document.createElement('span');
        rank.textContent = `${index + 1}.`;
        rank.style.fontWeight = 'bold';
        rank.style.display = 'block';
        rank.style.marginBottom = '0.5rem';

        const image = document.createElement('img');
        image.src = anime.images.jpg.image_url;
        image.alt = anime.title;

        const title = document.createElement('h3');
        title.textContent = anime.title;

        const score = document.createElement('span');
        score.classList.add('rank-score');
        score.textContent = `Score: ${anime.score}`;

        rankingCard.appendChild(rank);
        rankingCard.appendChild(image);
        rankingCard.appendChild(title);
        rankingCard.appendChild(score);
        rankingsGrid.appendChild(rankingCard);
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchTopAnime();
    fetchUpcomingAnime();
    fetchAnimeRankings();
    updateWatchlistDisplay();

    document.getElementById('anime-type-filter').addEventListener('change', (e) => {
        fetchTopAnime(e.target.value);
    });

    document.getElementById('anime-search').addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase();
        const filtered = allAnimeData.filter(anime =>
            anime.title.toLowerCase().includes(searchText)
        );
        displayAnime(filtered);
    });

    const addRankingButton = document.getElementById('add-ranking');
    if (addRankingButton) {
        addRankingButton.addEventListener('click', () => {
            const titleInput = document.getElementById('anime-title');
            const scoreInput = document.getElementById('anime-score');
            const title = titleInput.value.trim();
            const score = parseFloat(scoreInput.value);

            if (title && !isNaN(score) && score >= 0 && score <= 10) {
                alert(`You tried to rank: ${title} with a score of ${score}.\nNote: This functionality is currently client-side only and does not persist or interact with the Jikan API for ranking.`);
                titleInput.value = '';
                scoreInput.value = '';
            } else {
                alert('Please enter a valid anime title and a score between 0 and 10.');
            }
        });
    }

    // Comment form submission
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const textarea = commentForm.querySelector('textarea');
            const commentText = textarea.value.trim();
            
            if (commentText) {
                addNewComment(commentText);
                textarea.value = '';
            }
        });
    }

    // Like button functionality
    document.querySelectorAll('.like-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('liked');
            const likeCount = this.querySelector('i').nextSibling;
            if (this.classList.contains('liked')) {
                likeCount.textContent = parseInt(likeCount.textContent) + 1;
            } else {
                likeCount.textContent = parseInt(likeCount.textContent) - 1;
            }
        });
    });
});

function addNewComment(text) {
    const commentsList = document.querySelector('.comments-list');
    if (!commentsList) return;

    const newComment = document.createElement('div');
    newComment.className = 'comment';
    newComment.innerHTML = `
        <div class="user-avatar">
            <img src="https://ui-avatars.com/api/?name=User&background=ff4757&color=fff" alt="User Avatar">
        </div>
        <div class="comment-content">
            <div class="comment-header">
                <span class="username">You</span>
                <span class="timestamp">Just now</span>
            </div>
            <p class="comment-text">${text}</p>
            <div class="comment-actions">
                <button class="like-btn"><i class="fas fa-heart"></i> 0</button>
                <button class="reply-btn"><i class="fas fa-reply"></i> Reply</button>
            </div>
        </div>
    `;

    // Add like button functionality to the new comment
    const likeBtn = newComment.querySelector('.like-btn');
    likeBtn.addEventListener('click', function() {
        this.classList.toggle('liked');
        const likeCount = this.querySelector('i').nextSibling;
        if (this.classList.contains('liked')) {
            likeCount.textContent = parseInt(likeCount.textContent) + 1;
        } else {
            likeCount.textContent = parseInt(likeCount.textContent) - 1;
        }
    });

    commentsList.insertBefore(newComment, commentsList.firstChild);
    showNotification('Comment posted successfully!');
}

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.navbar')) {
            navLinks.classList.remove('active');
        }
    });
});

// Dark Mode Toggle
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.classList.add(savedTheme);
    updateThemeIcon();
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const currentTheme = body.classList.contains('dark-mode') ? 'dark-mode' : '';
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
});

function updateThemeIcon() {
    const icon = themeToggle.querySelector('i');
    if (body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// Loading Animation
function showLoading() {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loading);
    loading.style.display = 'flex';
}

function hideLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.remove();
    }
}

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});