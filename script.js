// Configurações globais
const scriptURL = 'https://script.google.com/macros/s/AKfycbzfhccxHP3Phetk2KuJuSZX9QD9Yh7krT9Sn4wIPuWeCD9kwTcPBWgzh1TfePL3sSw3/exec';
const localStorageKey = 'claramente-favorites';

// Elementos DOM
const toggleBtn = document.getElementById("theme-toggle");
const searchInput = document.getElementById("search-input");
const categoryButtons = document.querySelectorAll("#category-filter button");
const mobileCategoryMenu = document.createElement('select');
mobileCategoryMenu.id = 'mobile-category-menu';
mobileCategoryMenu.innerHTML = `
  <option value="all">Todas as categorias</option>
  <option value="cursos">Cursos</option>
  <option value="vídeos">Vídeos</option>
  <option value="páginas">Páginas</option>
  <option value="melhorar-habilidades">Melhorar habilidades</option>
  <option value="favoritos">⭐ Favoritos</option>
`;
document.querySelector('main').insertBefore(mobileCategoryMenu, document.getElementById('link-list'));

// Estado da aplicação
let appState = {
  currentCategory: 'all',
  favorites: JSON.parse(localStorage.getItem(localStorageKey)) || {},
  searchTerm: '',
  links: []
};

// 🌗 Alternar tema claro/escuro
function toggleTheme() {
  document.body.classList.toggle("dark-theme");
  const isDark = document.body.classList.contains("dark-theme");
  toggleBtn.textContent = isDark ? "☀️" : "🌙";
  toggleBtn.setAttribute('aria-label', isDark ? "Modo Claro" : "Modo Escuro");
  localStorage.setItem('themePreference', isDark ? 'dark' : 'light');
}

toggleBtn.addEventListener("click", toggleTheme);
toggleBtn.addEventListener("keydown", (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    toggleTheme();
  }
});

// Verificar preferência de tema salva
if (localStorage.getItem('themePreference') === 'dark') {
  document.body.classList.add("dark-theme");
  toggleBtn.textContent = "☀️";
  toggleBtn.setAttribute('aria-label', "Modo Claro");
}

// 🔍 Filtro de busca
function handleSearch() {
  appState.searchTerm = searchInput.value.toLowerCase();
  filterLinks();
}

searchInput.addEventListener("input", handleSearch);

// 🧭 Filtro por categoria
function setActiveCategory(category) {
  appState.currentCategory = category;
  
  categoryButtons.forEach(button => {
    if (button.dataset.category === category) {
      button.classList.add('active');
      button.setAttribute('aria-current', 'true');
    } else {
      button.classList.remove('active');
      button.removeAttribute('aria-current');
    }
  });
  
  mobileCategoryMenu.value = category;
  filterLinks();
}

categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    setActiveCategory(button.dataset.category);
  });
  
  button.addEventListener("keydown", (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setActiveCategory(button.dataset.category);
    }
  });
});

mobileCategoryMenu.addEventListener('change', () => {
  setActiveCategory(mobileCategoryMenu.value);
});

// Função para filtrar links
function filterLinks() {
  document.querySelectorAll(".category-block").forEach(block => {
    const isFavoritesView = appState.currentCategory === "favoritos";
    const shouldShowCategory = appState.currentCategory === "all" || 
                             block.id === appState.currentCategory ||
                             isFavoritesView;
    
    block.style.display = shouldShowCategory ? "block" : "none";
    
    if (shouldShowCategory) {
      const items = block.querySelectorAll("li:not(.skeleton-item)");
      items.forEach(li => {
        const url = li.getAttribute('data-url');
        const isFavorite = appState.favorites[url];
        
        // Mostrar sempre em categorias normais, filtrar por favoritos apenas na view de favoritos
        const shouldShowItem = (isFavoritesView ? isFavorite : true) && 
                             (appState.searchTerm === '' || 
                              li.textContent.toLowerCase().includes(appState.searchTerm));
        
        li.style.display = shouldShowItem ? "flex" : "none";
      });
    }
  });
  
  // Mostrar mensagem se não houver favoritos
  if (appState.currentCategory === "favoritos") {
    const hasFavorites = Object.keys(appState.favorites).length > 0;
    const favoriteItems = document.querySelectorAll('li[data-url]');
    let hasVisibleFavorites = false;
    
    favoriteItems.forEach(item => {
      const url = item.getAttribute('data-url');
      if (appState.favorites[url] && item.style.display !== 'none') {
        hasVisibleFavorites = true;
      }
    });
    
    const noFavoritesMessage = document.getElementById('no-favorites-message');
    if (!hasVisibleFavorites) {
      if (!noFavoritesMessage) {
        const message = document.createElement('p');
        message.id = 'no-favorites-message';
        message.textContent = 'Nenhum favorito encontrado. Marque links como favoritos clicando na estrela ★';
        message.style.textAlign = 'center';
        message.style.padding = '20px';
        message.style.color = 'var(--text-dark)';
        document.getElementById('link-list').appendChild(message);
      }
    } else if (noFavoritesMessage) {
      noFavoritesMessage.remove();
    }
  }
}

// ➕ Adicionar link na página
function addLinkToPage(title, url, category, isFavorite = false) {
  const categoryBlock = document.getElementById(category);
  if (!categoryBlock) return;

  const list = categoryBlock.querySelector("ul");
  if (!list) return;

  // Remover skeletons se existirem
  const skeletons = list.querySelectorAll('.skeleton-item');
  skeletons.forEach(s => s.remove());

  const item = document.createElement("li");
  item.setAttribute('data-url', url);
  
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = title;
  link.setAttribute('aria-label', `Abrir ${title} em nova aba`);
  
  // Botão de favorito
  const favoriteBtn = document.createElement("button");
  favoriteBtn.className = `favorite-btn ${isFavorite ? 'favorited' : ''}`;
  favoriteBtn.innerHTML = '★';
  favoriteBtn.setAttribute('aria-label', isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
  favoriteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleFavorite(url, favoriteBtn);
  });
  
  // Botão de compartilhar
  const shareBtn = document.createElement("button");
  shareBtn.className = 'share-btn';
  shareBtn.innerHTML = '↗️';
  shareBtn.setAttribute('aria-label', 'Compartilhar link');
  shareBtn.addEventListener('click', (e) => {
    e.preventDefault();
    shareLink(title, url);
  });
  
  item.appendChild(link);
  item.appendChild(favoriteBtn);
  item.appendChild(shareBtn);
  
  // Tooltip de preview
  setupLinkPreview(item, link, title, url);
  
  list.appendChild(item);
}

// ★ Toggle favorite
function toggleFavorite(url, button) {
  const isFavorited = !button.classList.contains('favorited');
  
  if (isFavorited) {
    button.classList.add('favorited');
    button.setAttribute('aria-label', 'Remover dos favoritos');
    appState.favorites[url] = true;
  } else {
    button.classList.remove('favorited');
    button.setAttribute('aria-label', 'Adicionar aos favoritos');
    delete appState.favorites[url];
  }
  
  localStorage.setItem(localStorageKey, JSON.stringify(appState.favorites));
  showNotification(isFavorited ? 'Adicionado aos favoritos' : 'Removido dos favoritos', 'info');
  
  // Atualizar a view se estivermos na categoria de favoritos
  if (appState.currentCategory === "favoritos") {
    filterLinks();
  }
}

// ↗️ Compartilhar link
function shareLink(title, url) {
  if (navigator.share) {
    navigator.share({
      title: title,
      text: 'Confira este recurso:',
      url: url
    }).catch(err => {
      console.error('Erro ao compartilhar:', err);
      showNotification('Erro ao compartilhar', 'error');
    });
  } else {
    navigator.clipboard.writeText(url).then(() => {
      showNotification('Link copiado!', 'success');
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      showNotification('Erro ao copiar link', 'error');
    });
  }
}

// 🔍 Configurar preview de link
function setupLinkPreview(item, link, title, url) {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = `${title} - ${new URL(url).hostname.replace('www.', '')}`;
  document.body.appendChild(tooltip);
  
  let timer;
  
  link.addEventListener('mouseenter', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const rect = item.getBoundingClientRect();
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.top = `${rect.top - 35}px`;
      tooltip.style.opacity = '1';
    }, 500);
  });
  
  link.addEventListener('mouseleave', () => {
    clearTimeout(timer);
    tooltip.style.opacity = '0';
  });
  
  item.addEventListener('mouseenter', () => {
    clearTimeout(timer);
    tooltip.style.opacity = '0';
  });
}

// 📤 Carregar links do Google Sheets
async function loadLinks() {
  showLoading(true);
  
  try {
    const response = await fetch(`${scriptURL}?action=get&t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    if (!data || !Array.isArray(data)) throw new Error('Dados inválidos recebidos');
    
    appState.links = data;
    
    // Limpar todas as listas
    document.querySelectorAll('#link-list ul').forEach(ul => {
      ul.innerHTML = '';
    });
    
    if (appState.links.length === 0) {
      showNotification('Nenhum link encontrado na base de dados', 'info');
      addFallbackLinks();
      return;
    }
    
    appState.links.forEach(link => {
      if (link.title && link.url && link.category) {
        const category = link.category.toLowerCase().replace(/\s+/g, '-');
        const isFavorite = appState.favorites[link.url];
        addLinkToPage(link.title, link.url, category, isFavorite);
      }
    });
    
    // Mostrar contagem de favoritos
    const favoriteCount = Object.keys(appState.favorites).length;
    if (favoriteCount > 0) {
      showNotification(`${favoriteCount} favorito${favoriteCount !== 1 ? 's' : ''} carregado${favoriteCount !== 1 ? 's' : ''}`, 'info');
    }
  } catch (error) {
    console.error('Erro ao carregar links:', error);
    showNotification(`Falha ao carregar links: ${error.message}`, 'error');
    addFallbackLinks();
  } finally {
    showLoading(false);
    filterLinks();
  }
}

// Adicionar links de fallback
function addFallbackLinks() {
  const fallbackLinks = [
    {
      title: 'Curso de JavaScript Moderno',
      url: 'https://javascript.info',
      category: 'cursos'
    },
    {
      title: 'Vídeo: Aprenda HTML em 1 hora',
      url: 'https://youtube.com/watch?v=exemplo',
      category: 'vídeos'
    },
    {
      title: 'Documentação MDN Web Docs',
      url: 'https://developer.mozilla.org',
      category: 'páginas'
    },
    {
      title: 'Exercícios para praticar lógica',
      url: 'https://leetcode.com',
      category: 'melhorar-habilidades'
    }
  ];
  
  fallbackLinks.forEach(link => {
    addLinkToPage(link.title, link.url, link.category, isFavorite);
  });
}

// 📩 Formulário de contato
document.getElementById('meuFormulario')?.addEventListener('submit', async e => {
  e.preventDefault();
  const statusElement = document.getElementById('statusEnvio');
  const form = e.target;
  
  try {
    statusElement.textContent = "Enviando...";
    statusElement.style.color = "var(--primary)";
    
    const response = await fetch(scriptURL, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    statusElement.textContent = "Enviado com sucesso!";
    statusElement.style.color = "green";
    form.reset();
    showNotification('Mensagem enviada com sucesso!', 'success');
  } catch (error) {
    console.error('Erro:', error);
    statusElement.textContent = "Erro ao enviar. Tente novamente.";
    statusElement.style.color = "red";
    showNotification('Erro ao enviar mensagem', 'error');
  }
});

// 🔔 Mostrar notificações
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.setAttribute('role', 'alert');
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// ⏳ Mostrar/ocultar loading
function showLoading(show) {
  const loader = document.getElementById('loading-indicator');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
    loader.setAttribute('aria-busy', show);
    loader.setAttribute('aria-live', 'polite');
  }
}

// 🖱️ Rolagem suave para seções
function setupScrollLinks() {
  document.querySelectorAll('.scroll-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        targetElement.style.boxShadow = '0 0 0 3px rgba(67, 97, 238, 0.3)';
        setTimeout(() => {
          targetElement.style.boxShadow = 'none';
        }, 1500);
        
        history.pushState(null, null, targetId);
        const category = targetId.substring(1);
        setActiveCategory(category);
      }
    });
  });
}

// 🛠 Service Worker para modo offline
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('ServiceWorker registrado com sucesso:', registration.scope);
      }).catch(err => {
        console.log('Falha ao registrar ServiceWorker:', err);
      });
    });
  }
}

// Função auxiliar para validar URLs
function isValidUrl(string) {
  try { 
    new URL(string); 
    return true; 
  } catch { 
    return false; 
  }
}

// ▶️ Inicializar
document.addEventListener('DOMContentLoaded', () => {
  console.log('Script iniciado');
  console.log('URL do script:', scriptURL);
  
  setupScrollLinks();
  setActiveCategory('all');
  loadLinks();
  registerServiceWorker();
  
  document.body.setAttribute('role', 'document');
  main.setAttribute('role', 'main');
});

// Enviar sugestão para o Google Sheets
document.getElementById('suggestion-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const statusElement = document.getElementById('suggestion-status');
  const form = e.target;
  
  const suggestion = {
    title: document.getElementById('suggest-title').value,
    url: document.getElementById('suggest-url').value,
    category: document.getElementById('suggest-category').value,
    timestamp: new Date().toLocaleString()
  };

  // Validação
  if (!isValidUrl(suggestion.url)) {
    statusElement.textContent = "❌ URL inválida! Use https://...";
    statusElement.style.color = "#f94144";
    return;
  }

  try {
    statusElement.textContent = "Enviando...";
    statusElement.style.color = "var(--primary)";

    const response = await fetch(scriptURL, {
      method: 'POST',
      body: JSON.stringify({
        action: "addSuggestion",
        data: suggestion
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    statusElement.textContent = "✅ Sugestão enviada! Obrigada!";
    statusElement.style.color = "green";
    form.reset();
    showNotification('Sugestão enviada com sucesso!', 'success');
  } catch (error) {
    console.error('Erro detalhado:', error);
    statusElement.textContent = "❌ Erro ao enviar. Tente novamente.";
    statusElement.style.color = "#f94144";
    showNotification('Erro ao enviar sugestão', 'error');
  }
});
