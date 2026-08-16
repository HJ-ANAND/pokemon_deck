"use client";

import { useEffect } from "react";
import Chart from "chart.js/auto";
import gsap from "gsap";
import AOS from "aos";

const POKE_API_BASE = "https://pokeapi.co/api/v2";
const INITIAL_LIMIT = 150;

const typeColors = {
  normal: { main: "#A8A77A", bg: "#A8A77A" },
  fire: { main: "#FF5A36", bg: "#FF5A36" },
  water: { main: "#3A82EB", bg: "#3A82EB" },
  electric: { main: "#F7D02C", bg: "#F7D02C" },
  grass: { main: "#52D167", bg: "#52D167" },
  ice: { main: "#96D9D6", bg: "#96D9D6" },
  fighting: { main: "#C22E28", bg: "#C22E28" },
  poison: { main: "#A33EA1", bg: "#9E45B8" },
  ground: { main: "#E2BF65", bg: "#E2BF65" },
  flying: { main: "#A98FF3", bg: "#A98FF3" },
  psychic: { main: "#F95587", bg: "#F95587" },
  bug: { main: "#A6B91A", bg: "#A6B91A" },
  rock: { main: "#B6A136", bg: "#B6A136" },
  ghost: { main: "#735797", bg: "#735797" },
  dragon: { main: "#6F35FC", bg: "#6F35FC" },
  dark: { main: "#705746", bg: "#705746" },
  steel: { main: "#B7B7CE", bg: "#B7B7CE" },
  fairy: { main: "#D685AD", bg: "#D685AD" },
};

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(119, 119, 119, ${alpha})`;
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getPokeballSVG(isCaught, sizeClass = "w-7 h-7") {
  return `
    <svg class="${sizeClass} pokeball-icon ${isCaught ? "caught" : "uncaught"} drop-shadow-md" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" class="pb-bg" stroke="currentColor" stroke-width="8" fill="transparent"/>
      <path d="M 4 50 A 46 46 0 0 1 96 50 Z" class="pb-top" fill="transparent" stroke="currentColor" stroke-width="8"/>
      <line x1="4" y1="50" x2="96" y2="50" stroke="currentColor" stroke-width="8"/>
      <circle cx="50" cy="50" r="14" class="pb-center-bg" fill="transparent" stroke="currentColor" stroke-width="8"/>
      <circle cx="50" cy="50" r="6" class="pb-center-dot" fill="currentColor"/>
      <circle cx="50" cy="50" r="46" class="pb-catch-flash" fill="white" opacity="0" pointer-events="none"/>
    </svg>
  `;
}

export default function Home() {
  useEffect(() => {
    const state = {
      allPokemonData: [],
      allPokemonBasic: [],
      isFetching: false,
      currentFilter: "all",
      searchQuery: "",
      favorites: JSON.parse(localStorage.getItem("pokeFavorites") || "[]"),
      viewFavoritesMode: false,
      isCompareMode: false,
      compareSelection: [],
      isBattleMode: false,
      battleSelection: [],
      userBattleDeck: [],
      cpuBattleDeck: [],
      userScore: 0,
      cpuScore: 0,
      currentRound: 1,
      detailChartInstance: null,
      compareChartInstance: null,
    };

    const grid = document.getElementById("pokemon-grid");
    const loader = document.getElementById("loader");
    const searchInput = document.getElementById("search-input");
    const searchSuggestions = document.getElementById("search-suggestions");
    const typeFiltersContainer = document.getElementById("type-filters");
    const noResults = document.getElementById("no-results");
    const modal = document.getElementById("pokemon-modal");
    const modalContent = document.getElementById("modal-content");
    const modalBody = document.getElementById("modal-body");
    const closeModalBtnOut = document.getElementById("close-modal-out");
    const randomBtn = document.getElementById("random-btn");
    const viewFavoritesBtn = document.getElementById("view-favorites-btn");
    const resetFiltersBtn = document.getElementById("reset-filters-btn");
    const favCountBadge = document.getElementById("fav-count");
    const compareToggleBtn = document.getElementById("compare-toggle-btn");
    const compareBanner = document.getElementById("compare-banner");
    const compareCountTxt = document.getElementById("compare-count");
    const executeCompareBtn = document.getElementById("execute-compare-btn");
    const compareModal = document.getElementById("compare-modal");
    const compareModalContent = document.getElementById(
      "compare-modal-content",
    );
    const compareModalBody = document.getElementById("compare-modal-body");
    const closeCompareOut = document.getElementById("close-compare-out");
    const closeCompareInner = document.getElementById("close-compare-inner");
    const battleToggleBtn = document.getElementById("battle-toggle-btn");
    const battleBanner = document.getElementById("battle-banner");
    const battleCountTxt = document.getElementById("battle-count");
    const executeBattleBtn = document.getElementById("execute-battle-btn");
    const battleModal = document.getElementById("battle-modal");
    const battleModalContent = document.getElementById("battle-modal-content");
    const closeBattleBtn = document.getElementById("close-battle-btn");

    let rafId = 0;
    const cleanupFns = [];

    const updateFavBadge = () => {
      if (!favCountBadge) return;
      favCountBadge.innerText = String(state.favorites.length);
      favCountBadge.classList.toggle("scale-0", state.favorites.length === 0);
    };

    const renderTypeFilters = () => {
      if (!typeFiltersContainer) return;
      typeFiltersContainer.innerHTML = "";

      const types = Object.keys(typeColors);
      const allBtn = document.createElement("button");
      allBtn.className =
        "filter-btn px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs tracking-widest uppercase font-bold bg-poke-red/10 border border-poke-red text-poke-red transition-all";
      allBtn.dataset.type = "all";
      allBtn.innerText = "All";
      typeFiltersContainer.appendChild(allBtn);

      types.forEach((type) => {
        const btn = document.createElement("button");
        btn.className =
          "filter-btn px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs tracking-widest uppercase font-bold bg-[#151A23] border border-[#1E2532] text-slate-400 hover:text-white transition-all";
        btn.dataset.type = type;
        btn.innerText = type;
        typeFiltersContainer.appendChild(btn);
      });

      document.querySelectorAll(".filter-btn").forEach((btn) => {
        const handleClick = () => {
          if (btn.dataset.type === "all") {
            state.viewFavoritesMode = false;
            state.searchQuery = "";
            if (searchInput) searchInput.value = "";
          }

          document.querySelectorAll(".filter-btn").forEach((button) => {
            button.classList.remove(
              "bg-poke-red/10",
              "border-poke-red",
              "text-poke-red",
            );
            button.classList.add(
              "bg-[#151A23]",
              "border-[#1E2532]",
              "text-slate-400",
            );
          });

          btn.classList.add(
            "bg-poke-red/10",
            "border-poke-red",
            "text-poke-red",
          );
          btn.classList.remove(
            "bg-[#151A23]",
            "border-[#1E2532]",
            "text-slate-400",
          );

          state.currentFilter = btn.dataset.type || "all";
          applyFilters();
        };
        btn.addEventListener("click", handleClick);
        cleanupFns.push(() => btn.removeEventListener("click", handleClick));
      });
    };

    const renderGrid = (pokemonArray) => {
      if (!grid || !noResults) return;
      grid.innerHTML = "";
      if (pokemonArray.length === 0) {
        noResults.classList.remove("hidden");
        return;
      }
      noResults.classList.add("hidden");

      pokemonArray.forEach((poke, index) => {
        const types = poke.types.map((type) => type.type.name);
        const mainType = types[0];
        const color = typeColors[mainType]?.main || "#777";
        const isFav = state.favorites.includes(poke.id);
        const isSelectedForCompare = state.compareSelection.includes(poke.id);
        const isSelectedForBattle = state.battleSelection.includes(poke.id);
        const formattedId = String(poke.id).padStart(3, "0");
        const name = poke.name.charAt(0).toUpperCase() + poke.name.slice(1);
        const imgUrl =
          poke.sprites.other?.["official-artwork"]?.front_default ||
          poke.sprites.front_default;
        const gifUrl =
          poke.sprites.versions?.["generation-v"]?.["black-white"]?.animated
            ?.front_default ||
          poke.sprites.front_default ||
          imgUrl;

        let borderClass = "border-poke-border hover:-translate-y-2";
        let checkHtml = "";

        if (isSelectedForCompare) {
          borderClass =
            "ring-2 ring-poke-red border-poke-red shadow-[0_0_20px_rgba(227,53,13,0.3)]";
          checkHtml =
            '<div class="mode-check absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 bg-poke-red rounded-bl-[20px] sm:rounded-bl-3xl flex items-center justify-center z-30 shadow-lg"><i class="fa-solid fa-check text-white text-xs sm:text-base"></i></div>';
        } else if (isSelectedForBattle) {
          borderClass =
            "ring-2 ring-poke-blue border-poke-blue shadow-[0_0_20px_rgba(58,130,235,0.3)]";
          checkHtml =
            '<div class="mode-check absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 bg-poke-blue rounded-bl-[20px] sm:rounded-bl-3xl flex items-center justify-center z-30 shadow-lg"><i class="fa-solid fa-shield text-white text-xs sm:text-base"></i></div>';
        }

        const card = document.createElement("div");
        card.className = `pokemon-card group relative bg-poke-card rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 cursor-pointer transition-all duration-300 border shadow-lg overflow-hidden ${borderClass}`;
        card.style.setProperty("--card-color", color);
        card.dataset.aos = "fade-up";
        card.dataset.aosDelay = String((index % 10) * 50);
        card.dataset.id = String(poke.id);

        card.innerHTML = `
          <i class="fa-solid fa-compact-disc card-watermark z-0"></i>
          ${checkHtml}
          <div class="flex justify-between items-start mb-2 relative z-10">
            <span class="text-slate-600 font-oswald font-bold tracking-wider text-xs sm:text-sm">#${formattedId}</span>
            <button class="fav-btn p-1.5 sm:p-2 -mr-1.5 sm:-mr-2 -mt-1.5 sm:-mt-2 rounded-full hover:bg-white/5 transition-colors z-20 relative" data-id="${poke.id}" title="${isFav ? "Release Pokémon" : "Catch Pokémon"}">
              ${getPokeballSVG(isFav, "w-5 h-5 sm:w-7 sm:h-7")}
            </button>
          </div>
          <div class="relative w-24 h-24 sm:w-36 sm:h-36 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full blur-[40px] opacity-10 group-hover:opacity-30 transition-opacity duration-500 z-0" style="background-color: ${color}"></div>
            <img src="${imgUrl}" alt="${name}" class="absolute z-10 w-full h-full object-contain transition-all duration-300 group-hover:opacity-0 group-hover:scale-75 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]" loading="lazy">
            <img src="${gifUrl}" alt="${name} animated sprite" class="absolute z-10 w-16 h-16 sm:w-24 sm:h-24 object-contain transition-all duration-300 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-125 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]" style="image-rendering: pixelated;" loading="lazy">
          </div>
          <div class="text-center relative z-10">
            <h2 class="text-lg sm:text-2xl font-bold text-white capitalize mb-2 sm:mb-4 tracking-wide truncate">${name}</h2>
            <div class="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
              ${types
                .map(
                  (type) =>
                    `<span class="px-2 py-0.5 sm:px-3 sm:py-1 rounded-[6px] text-[9px] sm:text-[10px] font-bold text-white tracking-[0.1em] uppercase shadow-sm" style="background-color: ${typeColors[type]?.bg || "#777"};">${type}</span>`,
                )
                .join("")}
            </div>
          </div>
        `;

        const handleCardClick = () => {
          if (state.isCompareMode) handleCompareSelection(poke.id);
          else if (state.isBattleMode) handleBattleSelection(poke.id);
          else openModal(poke.id);
        };
        card.addEventListener("click", handleCardClick);
        cleanupFns.push(() =>
          card.removeEventListener("click", handleCardClick),
        );

        const favBtn = card.querySelector(".fav-btn");
        const handleFavClick = (e) => {
          e.stopPropagation();
          toggleFavorite(poke.id, favBtn);
        };
        favBtn?.addEventListener("click", handleFavClick);
        cleanupFns.push(() =>
          favBtn?.removeEventListener("click", handleFavClick),
        );

        grid.appendChild(card);
      });

      if (document.querySelector(".aos-init")) AOS.refresh();
    };

    const updateGridSelectionUI = () => {
      document.querySelectorAll(".pokemon-card").forEach((card) => {
        const id = Number.parseInt(card.dataset.id || "0", 10);
        const checkmarkEl = card.querySelector(".mode-check");

        card.classList.remove(
          "ring-2",
          "ring-poke-red",
          "border-poke-red",
          "shadow-[0_0_20px_rgba(227,53,13,0.3)]",
          "ring-poke-blue",
          "border-poke-blue",
          "shadow-[0_0_20px_rgba(58,130,235,0.3)]",
        );
        card.classList.add("border-poke-border", "hover:-translate-y-2");
        checkmarkEl?.remove();

        if (state.isCompareMode && state.compareSelection.includes(id)) {
          card.classList.add(
            "ring-2",
            "ring-poke-red",
            "border-poke-red",
            "shadow-[0_0_20px_rgba(227,53,13,0.3)]",
          );
          card.classList.remove("border-poke-border", "hover:-translate-y-2");
          card.insertAdjacentHTML(
            "afterbegin",
            '<div class="mode-check absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 bg-poke-red rounded-bl-[20px] sm:rounded-bl-3xl flex items-center justify-center z-30 shadow-lg"><i class="fa-solid fa-check text-white text-xs sm:text-base"></i></div>',
          );
        } else if (state.isBattleMode && state.battleSelection.includes(id)) {
          card.classList.add(
            "ring-2",
            "ring-poke-blue",
            "border-poke-blue",
            "shadow-[0_0_20px_rgba(58,130,235,0.3)]",
          );
          card.classList.remove("border-poke-border", "hover:-translate-y-2");
          card.insertAdjacentHTML(
            "afterbegin",
            '<div class="mode-check absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 bg-poke-blue rounded-bl-[20px] sm:rounded-bl-3xl flex items-center justify-center z-30 shadow-lg"><i class="fa-solid fa-shield text-white text-xs sm:text-base"></i></div>',
          );
        }
      });
    };

    const applyFilters = () => {
      let filtered = state.allPokemonData;
      if (state.viewFavoritesMode)
        filtered = filtered.filter((pokemon) =>
          state.favorites.includes(pokemon.id),
        );
      if (state.currentFilter !== "all") {
        filtered = filtered.filter((pokemon) =>
          pokemon.types.some((type) => type.type.name === state.currentFilter),
        );
      }
      if (state.searchQuery)
        filtered = filtered.filter((pokemon) =>
          pokemon.name.includes(state.searchQuery.toLowerCase()),
        );

      if (resetFiltersBtn) {
        resetFiltersBtn.classList.toggle(
          "hidden",
          state.currentFilter === "all" &&
            !state.searchQuery &&
            !state.viewFavoritesMode,
        );
      }
      renderGrid(filtered);
    };

    const updateCompareUI = () => {
      if (compareCountTxt)
        compareCountTxt.innerText = String(state.compareSelection.length);
      if (!executeCompareBtn) return;
      if (state.compareSelection.length === 2) {
        executeCompareBtn.disabled = false;
        gsap.to(executeCompareBtn, {
          scale: 1.05,
          yoyo: true,
          repeat: 1,
          duration: 0.2,
        });
      } else {
        executeCompareBtn.disabled = true;
      }
    };

    const updateBattleUI = () => {
      if (battleCountTxt)
        battleCountTxt.innerText = String(state.battleSelection.length);
      if (!executeBattleBtn) return;
      if (state.battleSelection.length === 3) {
        executeBattleBtn.disabled = false;
        gsap.to(executeBattleBtn, {
          scale: 1.05,
          yoyo: true,
          repeat: 1,
          duration: 0.2,
        });
      } else {
        executeBattleBtn.disabled = true;
      }
    };

    const handleCompareSelection = (id) => {
      const index = state.compareSelection.indexOf(id);
      if (index > -1) state.compareSelection.splice(index, 1);
      else if (state.compareSelection.length < 2)
        state.compareSelection.push(id);
      else {
        state.compareSelection.shift();
        state.compareSelection.push(id);
      }
      updateCompareUI();
      updateGridSelectionUI();
    };

    const handleBattleSelection = (id) => {
      const index = state.battleSelection.indexOf(id);
      if (index > -1) state.battleSelection.splice(index, 1);
      else if (state.battleSelection.length < 3) state.battleSelection.push(id);
      else {
        state.battleSelection.shift();
        state.battleSelection.push(id);
      }
      updateBattleUI();
      updateGridSelectionUI();
    };

    const toggleCompareMode = () => {
      state.isCompareMode = !state.isCompareMode;
      if (state.isCompareMode) {
        if (state.isBattleMode) toggleBattleMode();
        compareToggleBtn?.classList.replace("bg-poke-red/10", "bg-poke-red");
        compareToggleBtn?.classList.replace("text-poke-red", "text-white");
        if (compareToggleBtn)
          compareToggleBtn.innerHTML =
            '<i class="fa-solid fa-xmark"></i> Cancel Compare';
        compareBanner?.classList.remove("translate-y-full");
      } else {
        compareToggleBtn?.classList.replace("bg-poke-red", "bg-poke-red/10");
        compareToggleBtn?.classList.replace("text-white", "text-poke-red");
        if (compareToggleBtn)
          compareToggleBtn.innerHTML =
            '<i class="fa-solid fa-code-compare"></i> Compare Mode';
        compareBanner?.classList.add("translate-y-full");
        state.compareSelection = [];
        updateCompareUI();
      }
      updateGridSelectionUI();
    };

    const toggleBattleMode = () => {
      state.isBattleMode = !state.isBattleMode;
      if (state.isBattleMode) {
        if (state.isCompareMode) toggleCompareMode();
        battleToggleBtn?.classList.replace("bg-poke-blue/10", "bg-poke-blue");
        battleToggleBtn?.classList.replace("text-poke-blue", "text-white");
        if (battleToggleBtn)
          battleToggleBtn.innerHTML =
            '<i class="fa-solid fa-xmark"></i> Cancel Battle';
        battleBanner?.classList.remove("translate-y-full");
      } else {
        battleToggleBtn?.classList.replace("bg-poke-blue", "bg-poke-blue/10");
        battleToggleBtn?.classList.replace("text-white", "text-poke-blue");
        if (battleToggleBtn)
          battleToggleBtn.innerHTML =
            '<i class="fa-solid fa-gamepad"></i> Battle Mode';
        battleBanner?.classList.add("translate-y-full");
        state.battleSelection = [];
        updateBattleUI();
      }
      updateGridSelectionUI();
    };

    const fetchSinglePokemon = async (idOrName) => {
      try {
        const response = await fetch(
          `${POKE_API_BASE}/pokemon/${idOrName.toLowerCase()}`,
        );
        if (!response.ok) throw new Error("Not found");
        return await response.json();
      } catch {
        return null;
      }
    };

    const fetchInitialPokemon = async () => {
      state.isFetching = true;
      const response = await fetch(
        `${POKE_API_BASE}/pokemon?limit=${INITIAL_LIMIT}`,
      );
      const data = await response.json();
      const promises = data.results.map((pokemon) =>
        fetch(pokemon.url).then((res) => res.json()),
      );
      state.allPokemonData = await Promise.all(promises);
      state.isFetching = false;
    };

    const fetchBasicList = async () => {
      const response = await fetch(`${POKE_API_BASE}/pokemon?limit=1000`);
      const data = await response.json();
      state.allPokemonBasic = data.results;
    };

    const updateLoader = () => {
      if (!loader) return;
      loader.style.opacity = "0";
      setTimeout(() => {
        loader.style.display = "none";
        AOS.init({ once: true, offset: 50, duration: 600 });
        gsap.from("#hero-content", {
          y: 30,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        });
      }, 500);
    };

    const initParallax = () => {
      const layer1 = document.getElementById("layer-1");
      const layer2 = document.getElementById("layer-2");
      const layer3 = document.getElementById("layer-3");
      const layer0El = document.getElementById("layer-0");

      if (!layer1 || !layer2 || !layer3) return;

      const starFrag = document.createDocumentFragment();
      for (let i = 0; i < 55; i += 1) {
        const star = document.createElement("div");
        star.className = "parallax-star";
        const size = Math.random() * 2.5 + 0.5;
        const lo = (Math.random() * 0.12 + 0.05).toFixed(2);
        const hi = (Math.random() * 0.45 + 0.2).toFixed(2);
        const duration = (Math.random() * 3 + 1.5).toFixed(1);
        const delay = -(Math.random() * 4).toFixed(1);
        star.style.cssText = `width:${size}px;height:${size}px;left:${(Math.random() * 100).toFixed(2)}%;top:${(Math.random() * 100).toFixed(2)}%;--star-lo:${lo};--star-hi:${hi};animation:twinkle ${duration}s ease-in-out ${delay}s infinite;`;
        if (size > 1.5)
          star.style.boxShadow = `0 0 ${(size * 2).toFixed(1)}px rgba(255,255,255,${(hi * 0.4).toFixed(2)})`;
        starFrag.appendChild(star);
      }
      layer1.appendChild(starFrag);

      const pbSvg = `<svg viewBox="0 0 100 100" style="width:100%;height:100%"><circle cx="50" cy="50" r="46" stroke="currentColor" stroke-width="8" fill="transparent"/><path d="M 4 50 A 46 46 0 0 1 96 50 Z" fill="transparent" stroke="currentColor" stroke-width="8"/><line x1="4" y1="50" x2="96" y2="50" stroke="currentColor" stroke-width="8"/><circle cx="50" cy="50" r="14" fill="transparent" stroke="currentColor" stroke-width="8"/><circle cx="50" cy="50" r="6" fill="currentColor"/></svg>`;
      const pbFrag = document.createDocumentFragment();
      for (let i = 0; i < 8; i += 1) {
        const pb = document.createElement("div");
        const size = Math.random() * 120 + 35;
        const opacity = (0.025 + Math.random() * 0.04).toFixed(3);
        const duration = (Math.random() * 50 + 28).toFixed(0);
        const anim = i % 2 === 0 ? "pbSpin" : "pbSpinRev";
        pb.style.cssText = `position:absolute;color:#94a3b8;opacity:${opacity};width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;animation:${anim} ${duration}s linear infinite;transform-origin:center;`;
        pb.innerHTML = pbSvg;
        pbFrag.appendChild(pb);
      }
      layer2.appendChild(pbFrag);

      const pokeIds = [6, 9, 3, 25, 94, 150];
      const silhouetteFrag = document.createDocumentFragment();
      pokeIds.forEach((id, index) => {
        const img = document.createElement("img");
        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
        const size = Math.random() * 190 + 110;
        const opacity = (0.025 + Math.random() * 0.02).toFixed(3);
        const floatY = (Math.random() * 38 + 18).toFixed(0);
        const duration = (Math.random() * 5 + 5).toFixed(1);
        const delay = -(Math.random() * 5).toFixed(1);
        img.style.cssText = `position:absolute;filter:brightness(0) invert(1);opacity:${opacity};width:${size.toFixed(0)}px;left:${((index / pokeIds.length) * 95 + Math.random() * 5).toFixed(1)}%;top:${(Math.random() * 75).toFixed(1)}%;--fy:${floatY}px;animation:floatY ${duration}s ease-in-out ${delay}s infinite;`;
        silhouetteFrag.appendChild(img);
      });
      layer3.appendChild(silhouetteFrag);

      let targetX = 0;
      let targetY = 0;
      let scrollY = 0;
      let c0x = 0;
      let c0y = 0;
      let c1x = 0;
      let c1y = 0;
      let c2x = 0;
      let c2y = 0;
      let c3x = 0;
      let c3y = 0;
      let ckx = 0;
      let cky = 0;
      const LERP = 0.055;

      const onMouseMove = (event) => {
        targetX = (event.clientX / window.innerWidth - 0.5) * 2;
        targetY = (event.clientY / window.innerHeight - 0.5) * 2;
      };
      const onScroll = () => {
        scrollY = window.scrollY;
      };

      document.addEventListener("mousemove", onMouseMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanupFns.push(() =>
        document.removeEventListener("mousemove", onMouseMove),
      );
      cleanupFns.push(() => window.removeEventListener("scroll", onScroll));

      const heroHeader = document.querySelector("header");
      const kantoEl = document.querySelector(".kanto-watermark");
      const heroContent = document.getElementById("hero-content");

      const raf = () => {
        c0x += (targetX * 8 - c0x) * LERP;
        c0y += (targetY * 8 - c0y) * LERP;
        c1x += (targetX * 18 - c1x) * LERP;
        c1y += (targetY * 18 - c1y) * LERP;
        c2x += (targetX * 45 - c2x) * LERP;
        c2y += (targetY * 45 - c2y) * LERP;
        c3x += (targetX * 90 - c3x) * LERP;
        c3y += (targetY * 90 - c3y) * LERP;
        ckx += (targetX * -30 - ckx) * LERP;
        cky += (targetY * -30 - cky) * LERP;

        const heroHeight = heroHeader ? heroHeader.offsetHeight : 500;
        const inHero = scrollY < heroHeight;
        const sy0 = inHero ? scrollY * 0.05 : 0;
        const sy1 = inHero ? scrollY * 0.15 : 0;
        const sy2 = inHero ? scrollY * 0.3 : 0;
        const sy3 = inHero ? scrollY * 0.5 : 0;
        const skY = inHero ? scrollY * -0.12 : 0;
        const progress = inHero ? scrollY / heroHeight : 1;

        if (layer0El)
          layer0El.style.transform = `translate3d(${c0x.toFixed(2)}px,${(c0y + sy0).toFixed(2)}px,0)`;
        if (layer1)
          layer1.style.transform = `translate3d(${c1x.toFixed(2)}px,${(c1y + sy1).toFixed(2)}px,0)`;
        if (layer2)
          layer2.style.transform = `translate3d(${c2x.toFixed(2)}px,${(c2y + sy2).toFixed(2)}px,0)`;
        if (layer3)
          layer3.style.transform = `translate3d(${c3x.toFixed(2)}px,${(c3y + sy3).toFixed(2)}px,0)`;
        if (kantoEl)
          kantoEl.style.transform = `translate3d(${ckx.toFixed(2)}px,${(cky + skY).toFixed(2)}px,0)`;
        if (heroContent && inHero) {
          heroContent.style.transform = `translate3d(0,${(scrollY * 0.2).toFixed(2)}px,0)`;
          heroContent.style.opacity = Math.max(0, 1 - progress * 1.6).toFixed(
            3,
          );
        }
        rafId = window.requestAnimationFrame(raf);
      };
      rafId = window.requestAnimationFrame(raf);
    };

    const showModalContainer = () => {
      modal?.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        modal?.classList.remove("opacity-0");
        modal?.classList.add("opacity-100");
        modalContent?.classList.remove("scale-95");
        modalContent?.classList.add("scale-100");
      });
    };

    const closeModal = () => {
      modal?.classList.remove("opacity-100");
      modal?.classList.add("opacity-0");
      modalContent?.classList.remove("scale-100");
      modalContent?.classList.add("scale-95");
      setTimeout(() => {
        modal?.classList.add("hidden");
        document.body.style.overflow = "";
      }, 300);
    };

    const closeCompareModalFunc = () => {
      compareModal?.classList.remove("opacity-100");
      compareModal?.classList.add("opacity-0");
      compareModalContent?.classList.remove("scale-100");
      compareModalContent?.classList.add("scale-95");
      setTimeout(() => {
        compareModal?.classList.add("hidden");
        document.body.style.overflow = "";
      }, 300);
    };

    const closeBattleModalFunc = () => {
      battleModal?.classList.remove("opacity-100");
      battleModal?.classList.add("opacity-0");
      battleModalContent?.classList.remove("scale-100");
      battleModalContent?.classList.add("scale-95");
      setTimeout(() => {
        battleModal?.classList.add("hidden");
        document.body.style.overflow = "";
      }, 300);
    };

    const toggleFavorite = (id, btnEl) => {
      const index = state.favorites.indexOf(id);
      if (index > -1) state.favorites.splice(index, 1);
      else state.favorites.push(id);
      localStorage.setItem("pokeFavorites", JSON.stringify(state.favorites));
      updateFavBadge();

      if (btnEl) {
        btnEl.innerHTML = getPokeballSVG(
          state.favorites.includes(id),
          "w-5 h-5 sm:w-7 sm:h-7",
        );
        btnEl.title = state.favorites.includes(id)
          ? "Release Pokémon"
          : "Catch Pokémon";
      }
      if (state.viewFavoritesMode) applyFilters();
    };

    const renderBattleArena = () => {
      const battleScorePlayer = document.getElementById("battle-score-player");
      const battleScoreCpu = document.getElementById("battle-score-cpu");
      const cpuDeckEl = document.getElementById("battle-cpu-deck");
      const playerDeckEl = document.getElementById("battle-player-deck");
      const arenaP1 = document.getElementById("arena-card-player");
      const arenaP2 = document.getElementById("arena-card-cpu");
      const arenaVS = document.getElementById("arena-vs");
      const overlayMsg = document.getElementById("battle-overlay-msg");

      if (battleScorePlayer)
        battleScorePlayer.innerText = String(state.userScore);
      if (battleScoreCpu) battleScoreCpu.innerText = String(state.cpuScore);
      if (playerDeckEl) playerDeckEl.style.pointerEvents = "auto";

      if (
        !cpuDeckEl ||
        !playerDeckEl ||
        !arenaP1 ||
        !arenaP2 ||
        !arenaVS ||
        !overlayMsg
      )
        return;

      arenaP1.innerHTML = "";
      arenaP2.innerHTML = "";
      gsap.set([arenaP1, arenaP2], { opacity: 0, scale: 1 });
      gsap.set(arenaP1, { x: -200 });
      gsap.set(arenaP2, { x: 200 });
      gsap.set(arenaVS, { opacity: 0, scale: 0.5 });
      overlayMsg.classList.add("hidden");
      gsap.set(overlayMsg, { opacity: 0 });

      cpuDeckEl.innerHTML = state.cpuBattleDeck
        .map(
          (id) => `
            <div class="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-poke-card border border-poke-border rounded-full flex flex-col items-center justify-center shadow-lg relative" id="cpu-card-${id}">
              ${getPokeballSVG(true, "w-6 h-6 sm:w-8 sm:h-8 opacity-50")}
            </div>
          `,
        )
        .join("");

      playerDeckEl.innerHTML = state.userBattleDeck
        .map((id) => {
          const pokemon = state.allPokemonData.find((item) => item.id === id);
          const img =
            pokemon?.sprites.versions?.["generation-v"]?.["black-white"]
              ?.animated?.front_default || pokemon?.sprites.front_default;
          return `
            <div class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-poke-card border border-poke-blue rounded-xl flex flex-col items-center justify-center cursor-pointer hover:-translate-y-2 sm:hover:-translate-y-4 hover:shadow-[0_0_20px_rgba(58,130,235,0.4)] transition-all relative z-20 group" onclick="playBattleRound(${id})" id="player-card-${id}">
              <img src="${img}" class="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain group-hover:scale-125 transition-transform drop-shadow-md rendering-pixelated">
            </div>
          `;
        })
        .join("");

      window.playBattleRound = (playerId) => {
        playerId = Number.parseInt(playerId, 10);
        if (!playerDeckEl) return;
        playerDeckEl.style.pointerEvents = "none";

        const playerCard = document.getElementById(`player-card-${playerId}`);
        if (playerCard)
          gsap.to(playerCard, {
            opacity: 0,
            y: 50,
            duration: 0.3,
            onComplete: () => playerCard.remove(),
          });

        const cpuId =
          state.cpuBattleDeck[
            Math.floor(Math.random() * state.cpuBattleDeck.length)
          ];
        const cpuCard = document.getElementById(`cpu-card-${cpuId}`);
        if (cpuCard)
          gsap.to(cpuCard, {
            opacity: 0,
            y: -50,
            duration: 0.3,
            onComplete: () => cpuCard.remove(),
          });

        state.userBattleDeck = state.userBattleDeck.filter(
          (value) => value !== playerId,
        );
        state.cpuBattleDeck = state.cpuBattleDeck.filter(
          (value) => value !== cpuId,
        );

        const pokePlayer = state.allPokemonData.find(
          (pokemon) => pokemon.id === playerId,
        );
        const pokeCPU = state.allPokemonData.find(
          (pokemon) => pokemon.id === cpuId,
        );
        if (!pokePlayer || !pokeCPU) return;

        const getPower = (pokemon) =>
          pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
        const pPower = getPower(pokePlayer);
        const cPower = getPower(pokeCPU);

        const buildArenaCard = (pokemon) => {
          const img =
            pokemon.sprites.other?.["official-artwork"]?.front_default ||
            pokemon.sprites.front_default;
          return `
            <img src="${img}" class="w-full h-full object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.6)] z-10 relative">
            <div class="absolute bottom-[-15px] sm:bottom-[-30px] w-full text-center">
              <span class="text-white font-oswald text-xs sm:text-sm md:text-xl uppercase tracking-widest bg-poke-card px-2 sm:px-4 py-0.5 sm:py-1 border border-poke-border rounded-full shadow-lg truncate max-w-full block mx-auto">${pokemon.name}</span>
              <div class="text-[9px] sm:text-xs font-bold text-slate-400 mt-1 sm:mt-2 tracking-widest power-text opacity-0">PWR: <span class="text-white text-sm sm:text-lg">${getPower(pokemon)}</span></div>
            </div>
          `;
        };

        arenaP1.innerHTML = buildArenaCard(pokePlayer);
        arenaP2.innerHTML = buildArenaCard(pokeCPU);

        playCryById(playerId);
        setTimeout(() => playCryById(cpuId), 600);

        const tl = gsap.timeline();
        tl.to(arenaVS, {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "back.out(2)",
        })
          .to(
            arenaP1,
            { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" },
            "-=0.2",
          )
          .to(
            arenaP2,
            { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" },
            "-=0.4",
          )
          .to(arenaP1, { x: 30, duration: 0.1, delay: 0.4, ease: "power1.in" })
          .to(arenaP2, { x: -30, duration: 0.1, ease: "power1.in" }, "<")
          .call(() => {
            arenaP1.classList.add("anim-clash");
            arenaP2.classList.add("anim-clash");
          })
          .to(arenaP1, { x: 0, duration: 0.2 })
          .to(arenaP2, { x: 0, duration: 0.2 }, "<")
          .to(
            ".power-text",
            { opacity: 1, y: -10, duration: 0.4, ease: "back.out" },
            "+=0.2",
          )
          .call(() => {
            let resultText = "";
            if (pPower > cPower) {
              state.userScore += 1;
              resultText = `YOU WIN ROUND ${state.currentRound}`;
              gsap.to(arenaP2, {
                filter: "grayscale(1) brightness(0.4)",
                duration: 0.5,
              });
              gsap.to(arenaP1, {
                scale: 1.1,
                dropShadow: "0 0 30px rgba(58,130,235,0.8)",
                duration: 0.5,
              });
            } else if (cPower > pPower) {
              state.cpuScore += 1;
              resultText = `RIVAL WINS ROUND ${state.currentRound}`;
              gsap.to(arenaP1, {
                filter: "grayscale(1) brightness(0.4)",
                duration: 0.5,
              });
              gsap.to(arenaP2, {
                scale: 1.1,
                dropShadow: "0 0 30px rgba(227,53,13,0.8)",
                duration: 0.5,
              });
            } else {
              resultText = `ROUND ${state.currentRound} TIE!`;
            }

            if (battleScorePlayer)
              battleScorePlayer.innerText = String(state.userScore);
            if (battleScoreCpu)
              battleScoreCpu.innerText = String(state.cpuScore);
            showBattleResultOverlay(resultText);
          });
      };
    };

    const showBattleResultOverlay = (text) => {
      const overlay = document.getElementById("battle-overlay-msg");
      const msg = document.getElementById("battle-msg-text");
      const nextBtn = document.getElementById("battle-next-btn");
      const endBtn = document.getElementById("battle-end-btn");
      if (!overlay || !msg || !nextBtn || !endBtn) return;

      msg.innerHTML = text;

      const newNext = nextBtn.cloneNode(true);
      nextBtn.parentNode?.replaceChild(newNext, nextBtn);
      const newEnd = endBtn.cloneNode(true);
      endBtn.parentNode?.replaceChild(newEnd, endBtn);

      overlay.classList.remove("hidden");

      const isMatchOver =
        state.userScore >= 2 || state.cpuScore >= 2 || state.currentRound >= 3;

      if (!isMatchOver) {
        newNext.classList.remove("hidden");
        newEnd.classList.add("hidden");
        newNext.addEventListener("click", () => {
          state.currentRound += 1;
          renderBattleArena();
        });
      } else {
        newNext.classList.add("hidden");
        newEnd.classList.remove("hidden");

        let matchResultMsg = "";
        if (state.userScore > state.cpuScore)
          matchResultMsg =
            "<br><span class='text-xl sm:text-2xl md:text-4xl text-poke-blue mt-2 sm:mt-4 block leading-tight'>VICTORY! YOU WON THE MATCH!</span>";
        else if (state.cpuScore > state.userScore)
          matchResultMsg =
            "<br><span class='text-xl sm:text-2xl md:text-4xl text-poke-red mt-2 sm:mt-4 block leading-tight'>DEFEAT! RIVAL WON THE MATCH.</span>";
        else
          matchResultMsg =
            "<br><span class='text-xl sm:text-2xl md:text-4xl text-slate-400 mt-2 sm:mt-4 block leading-tight'>MATCH ENDED IN A DRAW.</span>";

        msg.innerHTML = text + matchResultMsg;
        newEnd.addEventListener("click", () => {
          closeBattleModalFunc();
          toggleBattleMode();
        });
      }

      gsap.to(overlay, { opacity: 1, duration: 0.5, delay: 0.5 });
    };

    const startBattle = () => {
      state.cpuBattleDeck = [];
      while (state.cpuBattleDeck.length < 3) {
        const randomPokemon =
          state.allPokemonData[
            Math.floor(Math.random() * state.allPokemonData.length)
          ];
        if (!state.cpuBattleDeck.includes(randomPokemon.id))
          state.cpuBattleDeck.push(randomPokemon.id);
      }

      state.userBattleDeck = [...state.battleSelection];
      state.userScore = 0;
      state.cpuScore = 0;
      state.currentRound = 1;

      renderBattleArena();
      battleModal?.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        battleModal?.classList.remove("opacity-0");
        battleModal?.classList.add("opacity-100");
        battleModalContent?.classList.remove("scale-95");
        battleModalContent?.classList.add("scale-100");
      });
    };

    const openCompareModal = async () => {
      if (state.compareSelection.length !== 2) return;

      const p1 = state.allPokemonData.find(
        (pokemon) => pokemon.id === state.compareSelection[0],
      );
      const p2 = state.allPokemonData.find(
        (pokemon) => pokemon.id === state.compareSelection[1],
      );
      if (!p1 || !p2 || !compareModalBody) return;

      const img1 =
        p1.sprites.other?.["official-artwork"]?.front_default ||
        p1.sprites.front_default;
      const img2 =
        p2.sprites.other?.["official-artwork"]?.front_default ||
        p2.sprites.front_default;
      const formatName = (value) =>
        value.charAt(0).toUpperCase() + value.slice(1);

      let html = `
        <div class="flex justify-between items-center mb-6 sm:mb-10 mt-2 sm:mt-4 relative">
          <div class="absolute top-1/2 left-0 w-full h-px bg-poke-border -z-10"></div>
          <div class="w-[45%] flex flex-col items-center bg-poke-modal z-10 px-2 sm:px-4">
            <img src="${img1}" alt="${p1.name}" class="w-20 h-20 sm:w-32 sm:h-32 md:w-48 md:h-48 object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] mb-2 sm:mb-4">
            <h3 class="text-sm sm:text-xl md:text-3xl font-bold uppercase tracking-widest text-white flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center">
              <span class="truncate w-full">${formatName(p1.name)}</span>
              <button onclick="playCryById('${p1.id}', this)" class="text-slate-500 hover:text-poke-red transition-colors text-sm sm:text-lg" title="Play Cry"><i class="fa-solid fa-volume-high"></i></button>
            </h3>
            <div class="flex flex-wrap justify-center gap-1 sm:gap-2 mt-1 sm:mt-2">
              ${p1.types.map((type) => `<span class="px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded text-[8px] sm:text-[9px] font-bold text-white uppercase shadow-sm" style="background-color: ${typeColors[type.type.name]?.bg || "#777"};">${type.type.name}</span>`).join("")}
            </div>
          </div>
          <div class="w-[10%] flex justify-center bg-poke-modal z-10">
            <div class="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-poke-card border sm:border-2 border-poke-red flex items-center justify-center text-poke-red font-black font-oswald text-xs sm:text-xl md:text-2xl shadow-[0_0_20px_rgba(227,53,13,0.3)]">VS</div>
          </div>
          <div class="w-[45%] flex flex-col items-center bg-poke-modal z-10 px-2 sm:px-4">
            <img src="${img2}" alt="${p2.name}" class="w-20 h-20 sm:w-32 sm:h-32 md:w-48 md:h-48 object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] mb-2 sm:mb-4">
            <h3 class="text-sm sm:text-xl md:text-3xl font-bold uppercase tracking-widest text-white flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center">
              <span class="truncate w-full">${formatName(p2.name)}</span>
              <button onclick="playCryById('${p2.id}', this)" class="text-slate-500 hover:text-poke-red transition-colors text-sm sm:text-lg" title="Play Cry"><i class="fa-solid fa-volume-high"></i></button>
            </h3>
            <div class="flex flex-wrap justify-center gap-1 sm:gap-2 mt-1 sm:mt-2">
              ${p2.types.map((type) => `<span class="px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded text-[8px] sm:text-[9px] font-bold text-white uppercase shadow-sm" style="background-color: ${typeColors[type.type.name]?.bg || "#777"};">${type.type.name}</span>`).join("")}
            </div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 text-center bg-poke-card border border-poke-border rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <div class="flex flex-col gap-1 sm:gap-2"><span class="text-white font-bold text-xs sm:text-base">${p1.height / 10}m</span><span class="text-white font-bold text-xs sm:text-base">${p1.weight / 10}kg</span></div>
          <div class="flex flex-col gap-1 sm:gap-2 border-x border-poke-border text-slate-500 font-bold uppercase tracking-widest text-[8px] sm:text-[10px] justify-center"><span>Height</span><span>Weight</span></div>
          <div class="flex flex-col gap-1 sm:gap-2"><span class="text-white font-bold text-xs sm:text-base">${p2.height / 10}m</span><span class="text-white font-bold text-xs sm:text-base">${p2.weight / 10}kg</span></div>
        </div>
        <div class="flex justify-between items-end border-b border-poke-border pb-3 sm:pb-4 mb-4 sm:mb-6">
          <h3 class="text-[9px] sm:text-[10px] text-slate-500 font-bold tracking-[0.1em] sm:tracking-[0.2em] uppercase flex items-center gap-1.5 sm:gap-2"><div class="w-3 sm:w-4 h-px bg-slate-600"></div> Combat Statistics</h3>
          <div class="flex bg-[#1A202C] rounded-lg p-1 border border-poke-border">
            <button class="compare-stat-toggle-btn active-toggle px-2 py-1 sm:px-3 sm:py-1 rounded-md bg-poke-card text-white text-[9px] sm:text-[10px] font-bold uppercase shadow-sm transition-all" data-view="radar">Radar</button>
            <button class="compare-stat-toggle-btn px-2 py-1 sm:px-3 sm:py-1 rounded-md text-slate-500 hover:text-white text-[9px] sm:text-[10px] font-bold uppercase transition-all" data-view="bars">Bars</button>
          </div>
        </div>
        <div id="compare-view-radar" class="w-full h-48 sm:h-64 md:h-80 relative flex justify-center mb-6 sm:mb-10"><canvas id="compareRadarChart"></canvas></div>
        <div id="compare-view-bars" class="space-y-4 sm:space-y-6 mb-6 sm:mb-10 hidden">
      `;

      p1.stats.forEach((stat, index) => {
        let statName = stat.stat.name.replace("-", " ");
        if (statName === "special attack") statName = "sp. atk";
        if (statName === "special defense") statName = "sp. def";

        const value1 = stat.base_stat;
        const value2 = p2.stats[index].base_stat;
        const weight1 =
          value1 > value2
            ? "text-poke-green font-black scale-110 drop-shadow-[0_0_5px_rgba(82,209,103,0.5)]"
            : value1 === value2
              ? "text-white font-bold"
              : "text-slate-500";
        const weight2 =
          value2 > value1
            ? "text-poke-green font-black scale-110 drop-shadow-[0_0_5px_rgba(82,209,103,0.5)]"
            : value1 === value2
              ? "text-white font-bold"
              : "text-slate-500";
        const maxStat = 255;
        const bar1Width = Math.min((value1 / maxStat) * 100, 100);
        const bar2Width = Math.min((value2 / maxStat) * 100, 100);

        html += `
          <div class="flex items-center w-full gap-1.5 sm:gap-4">
            <div class="flex-1 flex flex-col-reverse sm:flex-row items-end sm:items-center justify-end gap-1.5 sm:gap-4">
              <span class="${weight1} text-xs sm:text-base transition-all">${value1}</span>
              <div class="w-full max-w-[60px] sm:max-w-[150px] bg-[#1A202C] h-1 sm:h-1.5 rounded-full overflow-hidden border border-[#1A202C] flip-x"><div class="compare-bar-fill h-full rounded-full bg-${value1 > value2 ? "poke-green" : value1 === value2 ? "slate-300" : "slate-600"}" style="width: 0%;" data-target="${bar1Width}%"></div></div>
            </div>
            <span class="w-12 sm:w-24 text-center text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest shrink-0">${statName}</span>
            <div class="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-start gap-1.5 sm:gap-4">
              <div class="w-full max-w-[60px] sm:max-w-[150px] bg-[#1A202C] h-1 sm:h-1.5 rounded-full overflow-hidden border border-[#1A202C]"><div class="compare-bar-fill h-full rounded-full bg-${value2 > value1 ? "poke-green" : value1 === value2 ? "slate-300" : "slate-600"}" style="width: 0%;" data-target="${bar2Width}%"></div></div>
              <span class="${weight2} text-xs sm:text-base transition-all">${value2}</span>
            </div>
          </div>
        `;
      });

      html += `</div>`;
      compareModalBody.innerHTML = html;
      compareModalBody.scrollTop = 0;

      const compToggleBtns = document.querySelectorAll(
        ".compare-stat-toggle-btn",
      );
      const compRadarView = document.getElementById("compare-view-radar");
      const compBarsView = document.getElementById("compare-view-bars");

      compToggleBtns.forEach((button) => {
        button.addEventListener("click", (event) => {
          const view = event.currentTarget.dataset.view;
          compToggleBtns.forEach((toggle) => {
            toggle.classList.remove(
              "bg-poke-card",
              "text-white",
              "shadow-sm",
              "active-toggle",
            );
            toggle.classList.add("text-slate-500");
          });
          event.target.classList.add(
            "bg-poke-card",
            "text-white",
            "shadow-sm",
            "active-toggle",
          );
          event.target.classList.remove("text-slate-500");

          if (view === "radar") {
            compRadarView?.classList.remove("hidden");
            compBarsView?.classList.add("hidden");
          } else {
            compRadarView?.classList.add("hidden");
            compBarsView?.classList.remove("hidden");
          }
        });
      });

      compareModal?.classList.remove("hidden");
      document.body.style.overflow = "hidden";

      requestAnimationFrame(() => {
        compareModal?.classList.remove("opacity-0");
        compareModal?.classList.add("opacity-100");
        compareModalContent?.classList.remove("scale-95");
        compareModalContent?.classList.add("scale-100");
      });

      const scanOverlay = document.getElementById("global-scan-overlay");
      const scanText = document.getElementById("global-scan-text");
      const scanIcon = document.getElementById("global-scan-icon");
      const scanLaser = document.getElementById("global-scan-laser");
      if (!scanOverlay || !scanText || !scanIcon || !scanLaser) return;

      compareModalContent?.appendChild(scanOverlay);
      scanOverlay.style.display = "flex";
      gsap.set(scanOverlay, { opacity: 1 });
      scanIcon.className =
        "fa-solid fa-server text-2xl sm:text-3xl text-poke-red animate-pulse";
      scanText.innerText = "INITIATING COMBAT ANALYSIS...";
      gsap.set(scanLaser, { top: "0%" });
      const laserAnim = gsap.to(scanLaser, {
        top: "100%",
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "linear",
      });

      const timeline = gsap.timeline();
      timeline
        .to(
          {},
          {
            duration: 0.4,
            onComplete: () =>
              (scanText.innerText = "CROSS-REFERENCING DATABASE..."),
          },
        )
        .to(
          {},
          {
            duration: 0.4,
            onComplete: () =>
              (scanText.innerText = "CALCULATING STAT DIFFERENTIALS..."),
          },
        )
        .to(
          {},
          {
            duration: 0.4,
            onComplete: () => (scanText.innerText = "SIMULATING MATCHUP..."),
          },
        )
        .to(
          {},
          {
            duration: 0.3,
            onComplete: () => (scanText.innerText = "ANALYSIS COMPLETE."),
          },
        )
        .to(scanOverlay, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.out",
          delay: 0.2,
          onComplete: () => {
            scanOverlay.style.display = "none";
            laserAnim.kill();

            const statBars = document.querySelectorAll(".compare-bar-fill");
            statBars.forEach((bar, index) => {
              gsap.to(bar, {
                width: bar.dataset.target,
                duration: 0.8,
                ease: "power3.out",
                delay: index * 0.05,
              });
            });

            const compareCanvas = document.getElementById("compareRadarChart");
            const existingCompareChart = Chart.getChart(compareCanvas);
            if (existingCompareChart) existingCompareChart.destroy();
            if (state.compareChartInstance)
              state.compareChartInstance.destroy();

            const ctxComp = compareCanvas?.getContext("2d");
            if (!ctxComp) return;

            const compLabels = p1.stats.map((stat) => {
              let label = stat.stat.name.replace("-", " ");
              if (label === "special attack") return "Sp. Atk";
              if (label === "special defense") return "Sp. Def";
              return label.toUpperCase();
            });
            const data1 = p1.stats.map((stat) => stat.base_stat);
            const data2 = p2.stats.map((stat) => stat.base_stat);
            const color1 = typeColors[p1.types[0].type.name]?.main || "#777";
            const color2 = typeColors[p2.types[0].type.name]?.main || "#777";

            state.compareChartInstance = new Chart(ctxComp, {
              type: "radar",
              data: {
                labels: compLabels,
                datasets: [
                  {
                    label: p1.name.toUpperCase(),
                    data: data1,
                    backgroundColor: hexToRgba(color1, 0.4),
                    borderColor: color1,
                    pointBackgroundColor: color1,
                    borderWidth: 2,
                    pointRadius: 0,
                  },
                  {
                    label: p2.name.toUpperCase(),
                    data: data2,
                    backgroundColor: hexToRgba(color2, 0.4),
                    borderColor: color2,
                    pointBackgroundColor: color2,
                    borderWidth: 2,
                    pointRadius: 0,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    angleLines: { color: "rgba(255,255,255,0.1)" },
                    grid: { color: "rgba(255,255,255,0.1)" },
                    pointLabels: {
                      color: "rgba(255,255,255,0.6)",
                      font: {
                        family: "'Oswald', sans-serif",
                        size: 10,
                        letterSpacing: 1,
                      },
                    },
                    ticks: { display: false, min: 0, max: 200 },
                  },
                },
                plugins: {
                  legend: {
                    display: true,
                    labels: {
                      color: "white",
                      font: { family: "'Oswald', sans-serif" },
                      boxWidth: 10,
                    },
                  },
                },
                animation: { duration: 1500, easing: "easeOutExpo" },
              },
            });

            playCryById(p1.id);
            setTimeout(() => playCryById(p2.id), 800);
          },
        });
    };

    const playCryById = (id, btnEl) => {
      const pokemon = state.allPokemonData.find((entry) => entry.id == id);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (
        pokemon &&
        pokemon.cries &&
        (pokemon.cries.latest || pokemon.cries.legacy)
      ) {
        const url = pokemon.cries.latest || pokemon.cries.legacy;
        const audio = new Audio(url);
        audio.volume = 0.3;
        audio
          .play()
          .catch((error) => console.log("Audio play prevented:", error));

        if (btnEl) {
          gsap.fromTo(
            btnEl,
            { scale: 0.8 },
            { scale: 1.3, yoyo: true, repeat: 1, duration: 0.15 },
          );
        }
      }
    };

    const openModal = async (id) => {
      let pokemon = state.allPokemonData.find((entry) => entry.id == id);

      if (!pokemon) {
        if (modalBody) {
          modalBody.innerHTML = `<div class="w-full h-64 sm:h-96 flex flex-col justify-center items-center text-slate-500"><i class="fa-solid fa-circle-notch fa-spin text-3xl sm:text-4xl mb-4"></i><p class="uppercase tracking-widest text-[10px] sm:text-xs mt-2 sm:mt-4">Accessing Network...</p></div>`;
        }
        showModalContainer();
        pokemon = await fetchSinglePokemon(id.toString());
        if (pokemon) state.allPokemonData.push(pokemon);
        else {
          if (modalBody)
            modalBody.innerHTML = `<div class="p-8 text-center text-poke-red">Error loading databank.</div>`;
          return;
        }
      }

      let flavorText =
        "No database entry currently available for this specimen.";
      let evoChainHtml = "";

      try {
        const speciesRes = await fetch(
          `${POKE_API_BASE}/pokemon-species/${id}`,
        );
        const speciesData = await speciesRes.json();
        const entry = speciesData.flavor_text_entries.find(
          (item) => item.language.name === "en",
        );
        if (entry) flavorText = entry.flavor_text.replace(/\f|\n|\r/g, " ");

        if (speciesData.evolution_chain) {
          const evoRes = await fetch(speciesData.evolution_chain.url);
          const evoData = await evoRes.json();

          const result = [];
          let current = evoData.chain;
          while (current) {
            const urlParts = current.species.url
              .split("/")
              .filter((part) => part.trim() !== "");
            const speciesId = urlParts[urlParts.length - 1];
            const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${speciesId}.png`;
            result.push({
              name: current.species.name,
              id: speciesId,
              img: imgUrl,
            });
            current =
              current.evolves_to.length > 0 ? current.evolves_to[0] : null;
          }

          if (result.length > 1) {
            evoChainHtml = `
              <div class="mt-6 sm:mt-8 border-t border-poke-border pt-4 sm:pt-6">
                <h3 class="text-[9px] sm:text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 flex items-center gap-2"><div class="w-3 sm:w-4 h-px bg-slate-600"></div> Evolution Lineage</h3>
                <div class="flex items-center gap-3 sm:gap-4 overflow-x-auto custom-scrollbar pb-2 sm:pb-4">
                  ${result
                    .map(
                      (evolution, index) => `
                      <div class="flex items-center gap-3 sm:gap-4 shrink-0">
                        <div class="flex flex-col items-center gap-1.5 sm:gap-2 cursor-pointer group" onclick="openModal('${evolution.id}')">
                          <div class="w-12 h-12 sm:w-16 sm:h-16 bg-poke-card rounded-full border ${pokemon.id == evolution.id ? "border-poke-red shadow-[0_0_15px_rgba(227,53,13,0.4)]" : "border-poke-border group-hover:border-slate-400"} flex items-center justify-center p-1.5 sm:p-2 relative transition-all duration-300">
                            <img src="${evolution.img}" alt="${evolution.name}" class="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                          </div>
                          <span class="text-[9px] sm:text-[10px] ${pokemon.id == evolution.id ? "text-white" : "text-slate-400 group-hover:text-white"} font-bold capitalize tracking-wider transition-colors">${evolution.name}</span>
                        </div>
                        ${index < result.length - 1 ? '<i class="fa-solid fa-chevron-right text-slate-600 text-[10px] sm:text-xs"></i>' : ""}
                      </div>
                    `,
                    )
                    .join("")}
                </div>
              </div>
            `;
          }
        }
      } catch (error) {
        console.log("Failed to fetch species or evolution data", error);
      }

      const types = pokemon.types.map((type) => type.type.name);
      const mainType = types[0];
      const color = typeColors[mainType]?.main || "#777";
      const imgUrl =
        pokemon.sprites.other?.["official-artwork"]?.front_default ||
        pokemon.sprites.front_default;
      const formattedId = String(pokemon.id).padStart(3, "0");

      if (modalBody) {
        modalBody.innerHTML = `
          <div class="w-full md:w-5/12 shrink-0 p-6 sm:p-10 relative flex flex-col items-center justify-center text-white overflow-hidden" style="background: linear-gradient(180deg, ${color}15 0%, transparent 100%);">
            <div class="absolute -top-4 -left-4 text-[80px] sm:text-[120px] font-oswald font-bold opacity-10" style="color: ${color}">#${formattedId}</div>
            <img src="${imgUrl}" alt="${pokemon.name}" class="w-40 h-40 sm:w-56 sm:h-56 object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] z-10 mb-4 sm:mb-8 modal-poke-img opacity-0">
            <h2 class="text-2xl sm:text-4xl font-bold uppercase tracking-widest mb-4 sm:mb-6 z-10 text-center flex items-center justify-center gap-3 sm:gap-4">
              ${pokemon.name}
              <button onclick="playCryById('${pokemon.id}', this)" class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1A202C]/80 border border-poke-border hover:border-poke-red hover:text-poke-red text-white flex items-center justify-center text-xs sm:text-sm transition-all shadow-lg" title="Play Cry"><i class="fa-solid fa-volume-high"></i></button>
            </h2>
            <div class="flex gap-2 sm:gap-3 z-10">${types.map((type) => `<span class="px-4 sm:px-5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white shadow-lg" style="background-color: ${typeColors[type]?.bg || "#777"};">${type}</span>`).join("")}</div>
          </div>
          <div class="w-full md:w-7/12 p-4 sm:p-8 md:p-10 bg-poke-modal flex flex-col md:border-l border-t md:border-t-0 border-poke-border relative">
            <button id="close-modal-inner" class="absolute top-4 right-4 sm:top-8 sm:right-8 w-8 h-8 bg-[#1A202C] hover:bg-poke-red/20 rounded-full flex items-center justify-center text-slate-400 hover:text-poke-red transition-colors z-20 hidden md:flex border border-poke-border"><i class="fa-solid fa-xmark text-sm"></i></button>
            <div class="mb-6 sm:mb-8">
              <h3 class="text-[9px] sm:text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase mb-2 sm:mb-4 flex items-center gap-1.5 sm:gap-2"><div class="w-3 sm:w-4 h-px bg-slate-600"></div> Database Entry</h3>
              <p class="text-slate-300 italic text-xs sm:text-sm leading-relaxed font-light">"${flavorText}"</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div class="bg-poke-card border border-poke-border p-4 sm:p-5 rounded-xl sm:rounded-2xl"><p class="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 sm:mb-2">Height & Weight</p><p class="text-lg sm:text-xl font-medium text-white">${pokemon.height / 10}m <span class="text-slate-600">/</span> ${pokemon.weight / 10}kg</p></div>
              <div class="bg-poke-card border border-poke-border p-4 sm:p-5 rounded-xl sm:rounded-2xl"><p class="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2 sm:mb-3">Abilities</p><div class="flex flex-wrap gap-1.5 sm:gap-2">${pokemon.abilities.map((ability) => `<span class="px-2 py-1 sm:px-3 sm:py-1 bg-[#1E2532] text-white rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">${ability.ability.name.replace("-", " ")}</span>`).join("")}</div></div>
            </div>
            <div class="mb-4 sm:mb-6 flex justify-between items-end border-b border-poke-border pb-3 sm:pb-4">
              <h3 class="text-[9px] sm:text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase flex items-center gap-1.5 sm:gap-2"><div class="w-3 sm:w-4 h-px bg-slate-600"></div> Combat Statistics</h3>
              <div class="flex bg-[#1A202C] rounded-lg p-1 border border-poke-border"><button class="stat-toggle-btn active-toggle px-2 py-1 sm:px-3 sm:py-1 rounded-md bg-poke-card text-white text-[9px] sm:text-[10px] font-bold uppercase shadow-sm transition-all" data-view="radar">Radar</button><button class="stat-toggle-btn px-2 py-1 sm:px-3 sm:py-1 rounded-md text-slate-500 hover:text-white text-[9px] sm:text-[10px] font-bold uppercase transition-all" data-view="bars">Bars</button></div>
            </div>
            <div id="stat-view-radar" class="w-full h-48 sm:h-64 relative flex justify-center mb-4 sm:mb-6"><canvas id="detailRadarChart"></canvas></div>
            <div id="stat-view-bars" class="space-y-3 sm:space-y-4 pr-2 sm:pr-4 mb-4 sm:mb-6 hidden">${pokemon.stats
              .map((stat) => {
                let statName = stat.stat.name.replace("-", " ");
                if (statName === "special attack") statName = "sp. atk";
                if (statName === "special defense") statName = "sp. def";
                const value = stat.base_stat;
                const percentage = Math.min((value / 200) * 100, 100);
                return `<div class="flex items-center gap-2 sm:gap-4"><span class="w-16 sm:w-24 text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest">${statName}</span><div class="flex-1 bg-[#1A202C] h-1 sm:h-1.5 rounded-full overflow-hidden border border-[#1A202C]"><div class="stat-bar-fill h-full rounded-full bg-poke-green" style="width: 0%;" data-target-width="${percentage}%"></div></div><span class="w-6 sm:w-8 text-right text-xs font-bold text-white">${value}</span></div>`;
              })
              .join("")}</div>
            ${evoChainHtml}
          </div>
        `;
      }

      modalBody.scrollTop = 0;
      const closeInner = document.getElementById("close-modal-inner");
      if (closeInner) closeInner.addEventListener("click", closeModal);

      document.querySelectorAll(".stat-toggle-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
          const view = event.currentTarget.dataset.view;
          document.querySelectorAll(".stat-toggle-btn").forEach((toggle) => {
            toggle.classList.remove(
              "bg-poke-card",
              "text-white",
              "shadow-sm",
              "active-toggle",
            );
            toggle.classList.add("text-slate-500");
          });
          event.target.classList.add(
            "bg-poke-card",
            "text-white",
            "shadow-sm",
            "active-toggle",
          );
          event.target.classList.remove("text-slate-500");
          if (view === "radar") {
            document
              .getElementById("stat-view-radar")
              ?.classList.remove("hidden");
            document.getElementById("stat-view-bars")?.classList.add("hidden");
          } else {
            document.getElementById("stat-view-radar")?.classList.add("hidden");
            document
              .getElementById("stat-view-bars")
              ?.classList.remove("hidden");
          }
        });
      });

      showModalContainer();

      const scanOverlay = document.getElementById("global-scan-overlay");
      const scanText = document.getElementById("global-scan-text");
      const scanIcon = document.getElementById("global-scan-icon");
      const scanLaser = document.getElementById("global-scan-laser");
      if (!scanOverlay || !scanText || !scanIcon || !scanLaser) return;

      modalContent?.appendChild(scanOverlay);
      scanOverlay.style.display = "flex";
      gsap.set(scanOverlay, { opacity: 1 });
      scanIcon.className =
        "fa-solid fa-satellite-dish text-2xl sm:text-3xl text-poke-red animate-pulse";
      scanText.innerText = "INITIATING SCAN...";
      gsap.set(scanLaser, { top: "0%" });
      const laserAnim = gsap.to(scanLaser, {
        top: "100%",
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "linear",
      });

      const timeline = gsap.timeline();
      timeline
        .to(
          {},
          {
            duration: 0.4,
            onComplete: () => (scanText.innerText = "ANALYZING BIOMETRICS..."),
          },
        )
        .to(
          {},
          {
            duration: 0.4,
            onComplete: () =>
              (scanText.innerText = "CALCULATING COMBAT STATS..."),
          },
        )
        .to(
          {},
          {
            duration: 0.4,
            onComplete: () => (scanText.innerText = "ACCESSING DATABANK..."),
          },
        )
        .to(
          {},
          {
            duration: 0.3,
            onComplete: () => (scanText.innerText = "MATCH FOUND."),
          },
        )
        .to(scanOverlay, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.out",
          delay: 0.2,
          onComplete: () => {
            scanOverlay.style.display = "none";
            laserAnim.kill();

            gsap.fromTo(
              ".modal-poke-img",
              { y: -20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.5)" },
            );

            document
              .querySelectorAll(".stat-bar-fill")
              .forEach((bar, index) => {
                gsap.to(bar, {
                  width: bar.dataset.targetWidth,
                  duration: 0.8,
                  ease: "power2.out",
                  delay: index * 0.05,
                });
              });

            const detailCanvas = document.getElementById("detailRadarChart");
            const existingDetailChart = Chart.getChart(detailCanvas);
            if (existingDetailChart) existingDetailChart.destroy();
            if (state.detailChartInstance) state.detailChartInstance.destroy();

            const ctx = detailCanvas?.getContext("2d");
            if (!ctx) return;

            const labels = pokemon.stats.map((stat) => {
              let label = stat.stat.name.replace("-", " ");
              if (label === "special attack") return "Sp. Atk";
              if (label === "special defense") return "Sp. Def";
              return label.toUpperCase();
            });
            const data = pokemon.stats.map((stat) => stat.base_stat);

            state.detailChartInstance = new Chart(ctx, {
              type: "radar",
              data: {
                labels,
                datasets: [
                  {
                    label: pokemon.name.toUpperCase(),
                    data,
                    backgroundColor: hexToRgba(color, 0.4),
                    borderColor: color,
                    pointBackgroundColor: color,
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: color,
                    borderWidth: 2,
                    pointRadius: 3,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    angleLines: { color: "rgba(255,255,255,0.1)" },
                    grid: { color: "rgba(255,255,255,0.1)" },
                    pointLabels: {
                      color: "rgba(255,255,255,0.6)",
                      font: {
                        family: "'Oswald', sans-serif",
                        size: 10,
                        letterSpacing: 1,
                      },
                    },
                    ticks: { display: false, min: 0, max: 200 },
                  },
                },
                plugins: { legend: { display: false } },
                animation: { duration: 1500, easing: "easeOutExpo" },
              },
            });

            playCryById(pokemon.id);
          },
        });
    };

    const handleSearchInput = (event) => {
      const query = event.target.value.toLowerCase().trim();
      if (!query) {
        if (searchSuggestions) searchSuggestions.style.display = "none";
        state.searchQuery = "";
        applyFilters();
        return;
      }
      const matches = state.allPokemonBasic
        .filter((pokemon) => pokemon.name.includes(query))
        .slice(0, 5);
      if (matches.length > 0 && searchSuggestions) {
        searchSuggestions.innerHTML = matches
          .map(
            (match) => `
              <div class="suggestion-item px-4 py-3 hover:bg-poke-red/20 cursor-pointer border-b border-poke-border last:border-0 text-white capitalize text-sm transition-colors" data-name="${match.name}">${match.name}</div>
            `,
          )
          .join("");
        searchSuggestions.style.display = "block";
      } else if (searchSuggestions) {
        searchSuggestions.style.display = "none";
      }
    };

    const setupEventListeners = () => {
      if (searchInput) {
        searchInput.addEventListener("input", handleSearchInput);
        cleanupFns.push(() =>
          searchInput.removeEventListener("input", handleSearchInput),
        );
      }

      if (searchSuggestions) {
        const handleSuggestionClick = async (event) => {
          const item = event.target.closest(".suggestion-item");
          if (!item) return;
          const name = item.dataset.name;
          if (searchInput) searchInput.value = name;
          searchSuggestions.style.display = "none";
          state.searchQuery = name.toLowerCase();
          if (
            !state.allPokemonData.find(
              (pokemon) => pokemon.name === state.searchQuery,
            )
          ) {
            const pokemon = await fetchSinglePokemon(state.searchQuery);
            if (pokemon) state.allPokemonData.push(pokemon);
          }
          applyFilters();
        };
        searchSuggestions.addEventListener("click", handleSuggestionClick);
        cleanupFns.push(() =>
          searchSuggestions.removeEventListener("click", handleSuggestionClick),
        );
      }

      const handleDocumentClick = (event) => {
        if (!event.target.closest(".relative.max-w-xl") && searchSuggestions)
          searchSuggestions.style.display = "none";
      };
      document.addEventListener("click", handleDocumentClick);
      cleanupFns.push(() =>
        document.removeEventListener("click", handleDocumentClick),
      );

      if (randomBtn) {
        const handleRandomClick = () => {
          if (state.isCompareMode || state.isBattleMode) return;
          const randomId = Math.floor(Math.random() * 898) + 1;
          openModal(randomId);
        };
        randomBtn.addEventListener("click", handleRandomClick);
        cleanupFns.push(() =>
          randomBtn.removeEventListener("click", handleRandomClick),
        );
      }

      if (compareToggleBtn) {
        compareToggleBtn.addEventListener("click", toggleCompareMode);
        cleanupFns.push(() =>
          compareToggleBtn.removeEventListener("click", toggleCompareMode),
        );
      }
      if (executeCompareBtn) {
        executeCompareBtn.addEventListener("click", openCompareModal);
        cleanupFns.push(() =>
          executeCompareBtn.removeEventListener("click", openCompareModal),
        );
      }
      if (closeCompareOut) {
        closeCompareOut.addEventListener("click", closeCompareModalFunc);
        cleanupFns.push(() =>
          closeCompareOut.removeEventListener("click", closeCompareModalFunc),
        );
      }
      if (closeCompareInner) {
        closeCompareInner.addEventListener("click", closeCompareModalFunc);
        cleanupFns.push(() =>
          closeCompareInner.removeEventListener("click", closeCompareModalFunc),
        );
      }
      if (compareModal) {
        const handleCompareBackdrop = (event) => {
          if (event.target === compareModal) closeCompareModalFunc();
        };
        compareModal.addEventListener("click", handleCompareBackdrop);
        cleanupFns.push(() =>
          compareModal.removeEventListener("click", handleCompareBackdrop),
        );
      }

      if (battleToggleBtn) {
        battleToggleBtn.addEventListener("click", toggleBattleMode);
        cleanupFns.push(() =>
          battleToggleBtn.removeEventListener("click", toggleBattleMode),
        );
      }
      if (executeBattleBtn) {
        executeBattleBtn.addEventListener("click", startBattle);
        cleanupFns.push(() =>
          executeBattleBtn.removeEventListener("click", startBattle),
        );
      }
      if (closeBattleBtn) {
        closeBattleBtn.addEventListener("click", closeBattleModalFunc);
        cleanupFns.push(() =>
          closeBattleBtn.removeEventListener("click", closeBattleModalFunc),
        );
      }
      if (closeModalBtnOut) {
        closeModalBtnOut.addEventListener("click", closeModal);
        cleanupFns.push(() =>
          closeModalBtnOut.removeEventListener("click", closeModal),
        );
      }
      if (modal) {
        const handleBackdrop = (event) => {
          if (event.target === modal) closeModal();
        };
        modal.addEventListener("click", handleBackdrop);
        cleanupFns.push(() =>
          modal.removeEventListener("click", handleBackdrop),
        );
      }

      const handleKeydown = (event) => {
        if (event.key !== "Escape") return;
        if (!compareModal?.classList.contains("hidden"))
          closeCompareModalFunc();
        else if (!battleModal?.classList.contains("hidden"))
          closeBattleModalFunc();
        else if (!modal?.classList.contains("hidden")) closeModal();
      };
      document.addEventListener("keydown", handleKeydown);
      cleanupFns.push(() =>
        document.removeEventListener("keydown", handleKeydown),
      );

      if (viewFavoritesBtn) {
        const handleFavoritesClick = () => {
          state.viewFavoritesMode = true;
          state.searchQuery = "";
          if (searchInput) searchInput.value = "";
          state.currentFilter = "all";
          document.querySelectorAll(".filter-btn").forEach((button) => {
            button.classList.remove(
              "bg-poke-red/10",
              "border-poke-red",
              "text-poke-red",
            );
            button.classList.add(
              "bg-[#151A23]",
              "border-[#1E2532]",
              "text-slate-400",
            );
          });
          applyFilters();
          document
            .getElementById("filters-section")
            ?.scrollIntoView({ behavior: "smooth" });
        };
        viewFavoritesBtn.addEventListener("click", handleFavoritesClick);
        cleanupFns.push(() =>
          viewFavoritesBtn.removeEventListener("click", handleFavoritesClick),
        );
      }

      if (resetFiltersBtn) {
        const handleResetClick = () => {
          state.viewFavoritesMode = false;
          state.searchQuery = "";
          if (searchInput) searchInput.value = "";
          state.currentFilter = "all";
          document.querySelectorAll(".filter-btn").forEach((button) => {
            if (button.dataset.type === "all") {
              button.classList.add(
                "bg-poke-red/10",
                "border-poke-red",
                "text-poke-red",
              );
              button.classList.remove(
                "bg-[#151A23]",
                "border-[#1E2532]",
                "text-slate-400",
              );
            } else {
              button.classList.remove(
                "bg-poke-red/10",
                "border-poke-red",
                "text-poke-red",
              );
              button.classList.add(
                "bg-[#151A23]",
                "border-[#1E2532]",
                "text-slate-400",
              );
            }
          });
          applyFilters();
        };
        resetFiltersBtn.addEventListener("click", handleResetClick);
        cleanupFns.push(() =>
          resetFiltersBtn.removeEventListener("click", handleResetClick),
        );
      }

      const handleScrollNav = () => {
        const nav = document.getElementById("navbar");
        if (!nav) return;
        if (window.scrollY > 50)
          nav.classList.add("shadow-lg", "shadow-black/20");
        else nav.classList.remove("shadow-lg", "shadow-black/20");
      };
      window.addEventListener("scroll", handleScrollNav);
      cleanupFns.push(() =>
        window.removeEventListener("scroll", handleScrollNav),
      );
    };

    const init = async () => {
      updateFavBadge();
      initParallax();
      try {
        await fetchInitialPokemon();
        await fetchBasicList();
        renderTypeFilters();
        renderGrid(state.allPokemonData);
      } catch (error) {
        console.error("Initialization error:", error);
        if (grid) {
          grid.innerHTML =
            '<div class="col-span-full text-center text-poke-red font-bold">Signal lost. Failed to load database.</div>';
        }
      } finally {
        updateLoader();
      }
      setupEventListeners();
    };

    window.playCryById = playCryById;
    window.openModal = openModal;
    window.playBattleRound = window.playBattleRound || (() => {});

    init();

    return () => {
      cleanupFns.forEach((fn) => fn());
      if (rafId) window.cancelAnimationFrame(rafId);
      if (state.detailChartInstance) state.detailChartInstance.destroy();
      if (state.compareChartInstance) state.compareChartInstance.destroy();
      delete window.playCryById;
      delete window.openModal;
      delete window.playBattleRound;
    };
  }, []);

  return (
    <div className="antialiased min-h-screen relative pb-20 text-white bg-poke-bg">
      <div id="loader" className="loader-container">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-6 sm:mb-8">
          <div className="loader-ring" style={{ animationDuration: "0.9s" }} />
          <div
            className="loader-ring"
            style={{
              animationDuration: "1.4s",
              animationDirection: "reverse",
              width: "75%",
              height: "75%",
              borderColor: "rgba(227,53,13,0.08)",
              borderTopColor: "rgba(227,53,13,0.5)",
            }}
          />
          <img
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif"
            alt="Pikachu"
            className="w-8 h-8 sm:w-10 sm:h-10 rendering-pixelated z-10"
          />
        </div>
        <h2 className="text-[9px] sm:text-[10px] font-bold tracking-[0.5em] text-poke-red/80 animate-pulse uppercase">
          Accessing Database
        </h2>
        <div className="mt-4 flex gap-2 items-center">
          <div
            className="w-1 h-1 rounded-full bg-poke-red/60 animate-bounce"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="w-1 h-1 rounded-full bg-poke-red/60 animate-bounce"
            style={{ animationDelay: "0.15s" }}
          />
          <div
            className="w-1 h-1 rounded-full bg-poke-red/60 animate-bounce"
            style={{ animationDelay: "0.3s" }}
          />
        </div>
      </div>

      <div
        id="global-scan-overlay"
        className="absolute inset-0 z-[100] bg-poke-modal hidden flex-col items-center justify-center overflow-hidden rounded-3xl pointer-events-auto"
      >
        <div
          id="global-scan-laser"
          className="absolute top-0 left-0 w-full h-1 bg-poke-red shadow-[0_0_20px_2px_rgba(227,53,13,1)] z-50"
        />
        <div className="relative w-16 h-16 sm:w-24 sm:h-24 mb-4 sm:mb-6 flex items-center justify-center">
          <div
            className="absolute inset-0 border-t-4 border-poke-red rounded-full animate-spin"
            style={{ animationDuration: "1s" }}
          />
          <div
            className="absolute inset-2 border-r-4 border-poke-red/50 rounded-full animate-spin"
            style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
          />
          <i
            id="global-scan-icon"
            className="fa-solid fa-satellite-dish text-2xl sm:text-3xl text-poke-red animate-pulse"
          />
        </div>
        <p
          id="global-scan-text"
          className="text-poke-red font-oswald text-base sm:text-lg tracking-[0.2em] sm:tracking-[0.3em] uppercase animate-pulse text-center px-4"
        >
          INITIATING SCAN...
        </p>
        <div className="mt-4 sm:mt-6 flex gap-3">
          <div
            className="w-1.5 h-1.5 rounded-full bg-poke-red animate-bounce"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full bg-poke-red animate-bounce"
            style={{ animationDelay: "0.1s" }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full bg-poke-red animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
      </div>

      <nav
        className="fixed w-full z-40 top-0 transition-all duration-300 bg-[#0B0F19]/90 backdrop-blur-md border-b border-poke-border"
        id="navbar"
      >
        <div className="mx-auto px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center max-w-7xl">
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <i className="fa-solid fa-compact-disc text-white text-xl sm:text-2xl" />
            <span className="font-bold text-base sm:text-lg tracking-widest text-white uppercase">
              Poké<span className="text-poke-red">Index</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              id="view-favorites-btn"
              className="relative px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-slate-300 hover:bg-poke-red/10 hover:text-poke-red transition-colors text-xs sm:text-sm font-bold tracking-wider sm:tracking-widest uppercase flex items-center gap-1 sm:gap-2"
              title="View Captured Pokémon"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 pokeball-icon caught drop-shadow-md"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  className="pb-bg"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                />
                <path
                  d="M 4 50 A 46 46 0 0 1 96 50 Z"
                  className="pb-top"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <line
                  x1="4"
                  y1="50"
                  x2="96"
                  y2="50"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="14"
                  className="pb-center-bg"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="6"
                  className="pb-center-dot"
                  fill="currentColor"
                />
              </svg>
              <span className="hidden sm:inline">Captured</span>
              <span
                id="fav-count"
                className="absolute -top-1.5 -right-1 sm:-top-1 sm:-right-1 bg-poke-red text-white text-[9px] sm:text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-lg transform scale-0 transition-transform"
              >
                0
              </span>
            </button>
          </div>
        </div>
      </nav>

      <header className="relative pt-28 pb-10 sm:pt-32 sm:pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[55vh] overflow-hidden bg-poke-bg">
        <div id="hero-grid-overlay" />
        <div id="hero-vignette" />
        <div
          className="hero-ambient-glow hidden sm:block"
          style={{
            width: "600px",
            height: "400px",
            background: "#E3350D",
            top: "10%",
            left: "15%",
            opacity: 0.09,
          }}
        />
        <div
          className="hero-ambient-glow hidden sm:block"
          style={{
            width: "500px",
            height: "350px",
            background: "#6F35FC",
            top: "40%",
            right: "10%",
            opacity: 0.07,
          }}
        />
        <div
          className="hero-ambient-glow hidden sm:block"
          style={{
            width: "350px",
            height: "300px",
            background: "#3A82EB",
            bottom: "5%",
            left: "40%",
            opacity: 0.06,
          }}
        />
        <div
          id="parallax-bg"
          className="absolute -inset-[15%] z-0 pointer-events-none hidden sm:block"
        >
          <div id="layer-0" className="absolute inset-0" />
          <div id="layer-1" className="absolute inset-0" />
          <div id="layer-2" className="absolute inset-0" />
          <div id="layer-3" className="absolute inset-0" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <span className="kanto-watermark text-[30vw] sm:text-[25vw] md:text-[20vw] font-oswald font-bold text-white/[0.018] tracking-tighter select-none leading-none mt-20">
            KANTO
          </span>
        </div>
        <div
          className="text-center z-10 w-full relative max-w-4xl mx-auto"
          id="hero-content"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="h-px w-6 sm:w-16 bg-gradient-to-r from-transparent to-poke-red/60" />
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold tracking-[0.3em] sm:tracking-[0.4em] text-poke-red/90 uppercase">
              Grand Elemental Index
            </span>
            <div className="h-px w-6 sm:w-16 bg-gradient-to-l from-transparent to-poke-red/60" />
          </div>
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-oswald font-bold mb-8 sm:mb-12 tracking-tight uppercase leading-[0.9] drop-shadow-2xl">
            <span className="hero-title-main">CATCH</span>
            <br />
            <span className="hero-title-sub">&apos;EM ALL.</span>
          </h1>
          <div className="relative max-w-xl mx-auto group z-20">
            <div className="absolute inset-y-0 left-0 pl-4 sm:pl-6 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-slate-500 group-focus-within:text-poke-red transition-colors text-sm sm:text-base" />
            </div>
            <input
              type="text"
              id="search-input"
              autoComplete="off"
              className="block w-full pl-10 pr-4 py-3 sm:pl-14 sm:pr-6 sm:py-4 rounded-xl bg-[#151A23] border border-[#1E2532] focus:outline-none focus:border-poke-red focus:ring-1 focus:ring-poke-red/50 transition-all text-xs sm:text-sm shadow-2xl text-white placeholder-slate-600 tracking-wider font-medium"
              placeholder="Search Database..."
            />
            <div
              id="search-suggestions"
              className="suggestions-box text-left"
            />
          </div>
          <div className="flex justify-center gap-2 sm:gap-4 mt-4 sm:mt-6 flex-wrap">
            <button
              id="battle-toggle-btn"
              className="action-btn px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-poke-blue/10 border border-poke-blue/30 text-poke-blue text-[10px] sm:text-xs tracking-widest font-bold uppercase hover:bg-poke-blue hover:text-white transition-all flex items-center gap-1.5 sm:gap-2"
            >
              <i className="fa-solid fa-gamepad" /> Battle Mode
            </button>
            <button
              id="compare-toggle-btn"
              className="action-btn px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-poke-red/10 border border-poke-red/30 text-poke-red text-[10px] sm:text-xs tracking-widest font-bold uppercase hover:bg-poke-red hover:text-white transition-all flex items-center gap-1.5 sm:gap-2"
            >
              <i className="fa-solid fa-code-compare" /> Compare Mode
            </button>
            <button
              id="random-btn"
              className="action-btn action-btn-hover px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-white/5 border border-white/10 text-white text-[10px] sm:text-xs tracking-widest font-bold uppercase hover:border-slate-400 transition-all flex items-center gap-1.5 sm:gap-2"
            >
              <i className="fa-solid fa-shuffle" /> Random
            </button>
            <button
              id="reset-filters-btn"
              className="action-btn px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[10px] sm:text-xs tracking-widest font-bold uppercase hover:bg-white/10 transition-all hidden"
            >
              <i className="fa-solid fa-rotate-left" /> Clear Search
            </button>
          </div>
        </div>
      </header>

      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 sm:mt-4 mb-6 sm:mb-8 relative z-10"
        id="filters-section"
      >
        <div
          className="flex flex-wrap justify-center gap-2 sm:gap-3"
          id="type-filters"
        />
      </section>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-28 sm:pb-24 relative z-10">
        <div id="no-results" className="hidden text-center py-20">
          <i className="fa-solid fa-satellite-dish text-5xl sm:text-6xl text-slate-700 mb-4" />
          <h2 className="text-lg sm:text-xl font-bold tracking-widest uppercase text-slate-500">
            No Signal Found
          </h2>
        </div>
        <div
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
          id="pokemon-grid"
        />
      </main>

      <div
        id="compare-banner"
        className="fixed bottom-0 left-0 w-full bg-[#070b14]/95 backdrop-blur-md border-t border-poke-red/60 z-[45] transform translate-y-full transition-transform duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.7)]"
      >
        <div className="max-w-[1400px] mx-auto px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="flex items-center w-full sm:w-auto gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-poke-red/25 flex items-center justify-center border border-poke-red/70 text-poke-red shrink-0 shadow-[0_0_12px_rgba(227,53,13,0.2)]">
              <i className="fa-solid fa-magnifying-glass-chart text-xs sm:text-base" />
            </div>
            <div>
              <h3 className="font-oswald font-bold tracking-widest text-white uppercase text-sm sm:text-lg leading-tight drop-shadow-sm">
                Compare Mode
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-200/90 tracking-wider">
                Select 2 Pokémon from the grid.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6 border-t border-white/10 sm:border-0 pt-2 sm:pt-0 mt-1 sm:mt-0">
            <div className="font-bold font-oswald text-lg sm:text-xl tracking-widest bg-black/25 px-3 py-1 rounded-lg border border-white/10">
              <span id="compare-count" className="text-poke-red">
                0
              </span>
              <span className="text-slate-200/80">/2</span>
            </div>
            <button
              id="execute-compare-btn"
              disabled
              className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-poke-red text-white text-[10px] sm:text-xs tracking-widest font-bold uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(227,53,13,0.5)] disabled:shadow-none flex items-center justify-center flex-1 sm:flex-none gap-2"
            >
              <i className="fa-solid fa-bolt" /> Analyze Data
            </button>
          </div>
        </div>
      </div>

      <div
        id="battle-banner"
        className="fixed bottom-0 left-0 w-full bg-[#070b14]/95 backdrop-blur-md border-t border-poke-blue/60 z-[45] transform translate-y-full transition-transform duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.7)]"
      >
        <div className="max-w-[1400px] mx-auto px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="flex items-center w-full sm:w-auto gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-poke-blue/25 flex items-center justify-center border border-poke-blue/70 text-poke-blue shrink-0 shadow-[0_0_12px_rgba(58,130,235,0.2)]">
              <i className="fa-solid fa-gamepad text-xs sm:text-base" />
            </div>
            <div>
              <h3 className="font-oswald font-bold tracking-widest text-white uppercase text-sm sm:text-lg leading-tight drop-shadow-sm">
                Battle Mode
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-200/90 tracking-wider">
                Select exactly 3 Pokémon.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6 border-t border-white/10 sm:border-0 pt-2 sm:pt-0 mt-1 sm:mt-0">
            <div className="font-bold font-oswald text-lg sm:text-xl tracking-widest bg-black/25 px-3 py-1 rounded-lg border border-white/10">
              <span id="battle-count" className="text-poke-blue">
                0
              </span>
              <span className="text-slate-200/80">/3</span>
            </div>
            <button
              id="execute-battle-btn"
              disabled
              className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-poke-blue text-white text-[10px] sm:text-xs tracking-widest font-bold uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(58,130,235,0.5)] disabled:shadow-none flex items-center justify-center flex-1 sm:flex-none gap-2"
            >
              <i className="fa-solid fa-khanda" /> Enter Arena
            </button>
          </div>
        </div>
      </div>

      <div
        id="pokemon-modal"
        className="fixed inset-0 z-[60] hidden flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B0F19]/90 backdrop-blur-sm opacity-0 transition-opacity duration-300"
      >
        <button
          id="close-modal-out"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 md:hidden w-8 h-8 sm:w-10 sm:h-10 bg-poke-card rounded-full text-white flex items-center justify-center z-[70] shadow-lg border border-poke-border"
        >
          <i className="fa-solid fa-xmark text-sm sm:text-base" />
        </button>
        <div
          className="relative w-full max-w-[1000px] bg-poke-modal rounded-[24px] sm:rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-poke-border transform scale-95 transition-transform duration-300 flex flex-col max-h-[90vh]"
          id="modal-content"
        >
          <div
            id="modal-body"
            className="flex flex-col md:flex-row flex-1 overflow-y-auto relative custom-scrollbar w-full"
          />
        </div>
      </div>

      <div
        id="compare-modal"
        className="fixed inset-0 z-[60] hidden flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B0F19]/95 backdrop-blur-md opacity-0 transition-opacity duration-300"
      >
        <button
          id="close-compare-out"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 md:hidden w-8 h-8 sm:w-10 sm:h-10 bg-poke-card rounded-full text-white flex items-center justify-center z-[70] shadow-lg border border-poke-border"
        >
          <i className="fa-solid fa-xmark text-sm sm:text-base" />
        </button>
        <div
          className="relative w-full max-w-[1000px] bg-poke-modal rounded-[24px] sm:rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-poke-border transform scale-95 transition-transform duration-300 flex flex-col max-h-[90vh]"
          id="compare-modal-content"
        >
          <div className="p-4 sm:p-6 border-b border-poke-border flex justify-between items-center bg-poke-card shrink-0">
            <h2 className="text-base sm:text-xl font-oswald font-bold tracking-widest text-white uppercase flex items-center gap-2 sm:gap-3">
              <i className="fa-solid fa-server text-poke-red" /> Combat Analysis
            </h2>
            <button
              id="close-compare-inner"
              className="hidden md:flex w-8 h-8 bg-[#1A202C] hover:bg-poke-red/20 rounded-full items-center justify-center text-slate-400 hover:text-poke-red transition-colors border border-poke-border"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          </div>
          <div
            id="compare-modal-body"
            className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 flex flex-col gap-4 sm:gap-6 w-full custom-scrollbar relative"
          />
        </div>
      </div>

      <div
        id="battle-modal"
        className="fixed inset-0 z-[60] hidden flex items-center justify-center p-0 sm:p-4 md:p-6 bg-[#0B0F19]/95 backdrop-blur-md opacity-0 transition-opacity duration-300"
      >
        <div
          className="relative w-full h-full sm:h-[90vh] max-w-[1200px] bg-poke-modal sm:rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-poke-border transform scale-95 transition-transform duration-300 flex flex-col"
          id="battle-modal-content"
        >
          <div className="p-3 sm:p-4 md:p-6 border-b border-poke-border flex justify-between items-center bg-poke-card shrink-0 shadow-lg relative z-20">
            <h2 className="text-sm sm:text-lg md:text-xl font-oswald font-bold tracking-wider sm:tracking-widest text-white uppercase flex items-center gap-2 sm:gap-3">
              <i className="fa-solid fa-khanda text-poke-blue" /> Battle Arena{" "}
              <span className="text-slate-500 text-[10px] sm:text-sm hidden sm:inline ml-1 sm:ml-2">
                Best of 3
              </span>
            </h2>
            <div className="flex items-center gap-2 sm:gap-4 md:gap-8 bg-[#0B0F19] px-2 sm:px-4 py-1 sm:py-2 rounded-xl border border-poke-border">
              <div className="flex flex-col items-center">
                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Player
                </span>
                <span
                  className="text-xl sm:text-2xl font-oswald font-bold text-poke-blue leading-none"
                  id="battle-score-player"
                >
                  0
                </span>
              </div>
              <span className="text-slate-600 font-bold font-oswald text-base sm:text-xl">
                -
              </span>
              <div className="flex flex-col items-center">
                <span className="text-[8px] sm:text-[10px] text-poke-red font-bold uppercase tracking-widest drop-shadow-md">
                  Rival
                </span>
                <span
                  className="text-xl sm:text-2xl font-oswald font-bold text-poke-red leading-none"
                  id="battle-score-cpu"
                >
                  0
                </span>
              </div>
            </div>
            <button
              id="close-battle-btn"
              className="w-6 h-6 sm:w-8 sm:h-8 bg-[#1A202C] hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-poke-border"
            >
              <i className="fa-solid fa-xmark text-xs sm:text-sm" />
            </button>
          </div>
          <div
            id="battle-modal-body"
            className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#151A23] via-[#0B0F19] to-[#0B0F19]"
          >
            <div
              className="h-1/4 w-full flex justify-center items-start pt-4 sm:pt-6 gap-2 sm:gap-4 z-10"
              id="battle-cpu-deck"
            />
            <div className="flex-1 flex justify-center items-center w-full relative z-0">
              <div className="absolute inset-0 bg-poke-blue/5 blur-[100px] rounded-full pointer-events-none" />
              <div
                id="battle-arena-center"
                className="flex items-center justify-center gap-2 sm:gap-12 w-full px-2 sm:px-4"
              >
                <div
                  id="arena-card-player"
                  className="w-24 sm:w-48 h-32 sm:h-64 flex flex-col items-center justify-center opacity-0 transform -translate-x-20"
                />
                <div
                  id="arena-vs"
                  className="w-8 h-8 sm:w-16 sm:h-16 rounded-full bg-poke-card border border-slate-600 flex items-center justify-center text-slate-400 font-black font-oswald text-xs sm:text-xl shadow-lg opacity-0 scale-50 z-20 shrink-0"
                >
                  VS
                </div>
                <div
                  id="arena-card-cpu"
                  className="w-24 sm:w-48 h-32 sm:h-64 flex flex-col items-center justify-center opacity-0 transform translate-x-20"
                />
              </div>
            </div>
            <div
              className="h-1/4 w-full flex justify-center items-end pb-4 sm:pb-6 gap-2 sm:gap-4 z-10"
              id="battle-player-deck"
            />
            <div
              id="battle-overlay-msg"
              className="absolute inset-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md flex flex-col items-center justify-center hidden opacity-0 p-4"
            >
              <h2
                id="battle-msg-text"
                className="text-2xl sm:text-4xl md:text-6xl font-oswald font-bold uppercase tracking-widest text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] mb-6 sm:mb-8 text-center leading-tight"
              />
              <button
                id="battle-next-btn"
                className="hidden px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl bg-poke-blue text-white text-sm sm:text-base font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(58,130,235,0.4)] hover:bg-blue-600 transition-all w-full max-w-[250px]"
              >
                Next Round
              </button>
              <button
                id="battle-end-btn"
                className="hidden px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl bg-slate-700 text-white text-sm sm:text-base font-bold tracking-widest uppercase hover:bg-slate-600 transition-all mt-4 w-full max-w-[250px]"
              >
                Exit Arena
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
