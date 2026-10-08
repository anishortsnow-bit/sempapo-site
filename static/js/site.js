/* Promoção Sem Papo: interações do site (sem dependências) */
(function () {
  "use strict";
  var semMovimento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- números em reais ---------- */
  function lerReais(txt) {
    if (!txt) return NaN;
    var s = String(txt).replace(/[^\d.,]/g, "");
    if (!s) return NaN;
    if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
    else if (/\.\d{3}$/.test(s) || (s.match(/\./g) || []).length > 1) s = s.replace(/\./g, "");
    return parseFloat(s);
  }
  function reais(v) {
    return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
  }
  function pct(v) { return Math.round(v * 100) + "%"; }

  /* ---------- contagem regressiva ---------- */
  var relogio = document.querySelector("[data-contagem]");
  if (relogio) {
    var alvo = new Date(relogio.getAttribute("data-contagem")).getTime();
    var campos = {
      d: relogio.querySelector("[data-d]"), h: relogio.querySelector("[data-h]"),
      m: relogio.querySelector("[data-m]"), s: relogio.querySelector("[data-s]")
    };
    var tick = function () {
      var r = Math.max(0, alvo - Date.now());
      var d = Math.floor(r / 864e5), h = Math.floor(r / 36e5) % 24, m = Math.floor(r / 6e4) % 60, s = Math.floor(r / 1e3) % 60;
      campos.d.textContent = d;
      campos.h.textContent = String(h).padStart(2, "0");
      campos.m.textContent = String(m).padStart(2, "0");
      campos.s.textContent = String(s).padStart(2, "0");
    };
    tick(); setInterval(tick, 1000);
  }

  /* ---------- etiqueta animada do herói (exemplos ilustrativos) ---------- */
  var palco = document.querySelector("[data-palco]");
  if (palco) {
    var cenas = JSON.parse(palco.getAttribute("data-cenas"));
    var etq = palco.querySelector(".etiqueta"), car = palco.querySelector(".carimbo");
    var el = function (sel) { return palco.querySelector(sel); };
    var i = 0;
    var mostra = function () {
      var c = cenas[i % cenas.length];
      etq.classList.remove("riscar", "desenhar");
      car.classList.remove("bate", "verde", "ambar");
      if (c.cor) car.classList.add(c.cor);
      el(".etq-cat").textContent = c.cat;
      el(".etq-nome").textContent = c.nome;
      el(".etq-de").textContent = c.de ? "de " + reais(c.de) : "";
      el(".etq-pct").textContent = c.pct || "";
      el(".etq-pct").style.display = c.pct ? "" : "none";
      el(".etq-por").innerHTML = "<small>R$</small>" + c.por.toLocaleString("pt-BR");
      el(".etq-rodape").textContent = "";
      el(".etq-grafico path.linha").setAttribute("d", c.linha);
      el(".etq-grafico path.area").setAttribute("d", c.linha + " L300 70 L0 70 Z");
      el(".etq-grafico path.area").setAttribute("fill", c.cor === "verde" ? "rgba(0,196,106,.18)" : "rgba(255,59,48,.14)");
      car.textContent = c.selo;
      if (semMovimento) {
        etq.classList.add("riscar", "desenhar"); el(".etq-rodape").textContent = c.nota; car.classList.add("bate"); return;
      }
      setTimeout(function () { etq.classList.add("riscar"); }, 500);
      setTimeout(function () { etq.classList.add("desenhar"); }, 900);
      setTimeout(function () { el(".etq-rodape").textContent = c.nota; car.classList.add("bate"); }, 2300);
      i++;
    };
    mostra();
    if (!semMovimento) setInterval(mostra, 6500);
  }

  /* ---------- detector de desconto falso ---------- */
  var det = document.querySelector("[data-detector]");
  if (det) {
    var cProd = det.querySelector("[name=produto]"), cDe = det.querySelector("[name=de]"),
        cPor = det.querySelector("[name=por]"), cNormal = det.querySelector("[name=normal]");
    var saida = det.querySelector("[data-veredito]"), linkHist = det.querySelector("[data-historico]");
    var atualizaLink = function () {
      var n = cProd.value.trim();
      linkHist.href = n ? "https://www.google.com/search?tbm=shop&q=" + encodeURIComponent(n) : "https://shopping.google.com/";
      linkHist.textContent = n ? "Não sabe? Ver o histórico de preço de \u201c" + (n.length > 28 ? n.slice(0, 28) + "\u2026" : n) + "\u201d \u2197" : "Não sabe? Ver o histórico de preço deste produto \u2197";
    };
    cProd.addEventListener("input", atualizaLink);
    var analisa = function (anima) {
      var nome = cProd.value.trim(), de = lerReais(cDe.value), por = lerReais(cPor.value), normal = lerReais(cNormal.value);
      if (!(por > 0)) {
        saida.innerHTML = '<p class="vazio">Coloque pelo menos o preço de agora.</p>'; cPor.focus(); return;
      }
      if (!(normal > 0)) {
        saida.innerHTML = (de > por ? '<div class="numeros"><div><small>Desconto anunciado</small><b>' + pct(1 - por / de) + "</b></div></div>" : "") +
          '<p>Falta o <b>quanto ele costumava custar</b>. Sem isso, não dá para saber se o desconto é real: o \u201cde\u201d pode ter sido inventado. ' +
          'Use o link \u201cver o histórico\u201d logo acima.</p>';
        cNormal.focus(); return;
      }
      var anunciado = de > por ? 1 - por / de : 0;
      var real = 1 - por / normal;
      var deInflado = de > 0 && de >= normal * 1.25;
      var selo, cor, texto;
      if (real >= 0.15) {
        selo = "Preço real"; cor = "verde";
        texto = "Está " + reais(normal - por) + " abaixo do que costumava custar. Desconto de verdade." +
          (deInflado ? " Só ignore o percentual da loja: o \u201cde\u201d é inflado, e o desconto real é " + pct(real) + "." : "");
      } else if (deInflado) {
        selo = "Maquiado"; cor = "";
        texto = "O \u201cde\u201d de " + reais(de) + " é " + pct(de / normal - 1) + " maior do que o produto costumava custar. O desconto anunciado não existe.";
      } else if (real >= 0.05) {
        selo = "Espere"; cor = "ambar";
        texto = "Tem desconto, mas pequeno (" + pct(real) + "). Em datas como a Black Friday, esse tipo de produto costuma cair mais.";
      } else if (real > -0.02) {
        selo = anunciado >= 0.2 ? "Maquiado" : "Espere"; cor = anunciado >= 0.2 ? "" : "ambar";
        texto = anunciado >= 0.2 ? "A loja anuncia " + pct(anunciado) + " de desconto, mas é o preço de sempre." : "É o preço de sempre. Não tem promoção aqui.";
      } else {
        selo = "Maquiado"; cor = "";
        texto = "Está " + reais(por - normal) + " ACIMA do que costumava custar. Fuja.";
      }
      saida.innerHTML =
        (nome ? '<span class="produto-checado">' + nome.replace(/[<>&]/g, "") + "</span>" : "") +
        '<span class="carimbo ' + cor + (anima ? " bate" : "") + '">' + selo + "</span>" +
        '<div class="numeros"><div class="' + (anunciado > real + 0.05 ? "falso" : "") + '"><small>Desconto anunciado</small><b>' + (de > por ? pct(anunciado) : "\u2014") + "</b></div>" +
        '<div class="real"><small>Desconto real</small><b>' + (real > 0 ? pct(real) : "0%") + "</b></div></div>" +
        "<p>" + texto + "</p>" +
        '<div class="acoes-detector"><button type="button" data-copiar>Copiar link do resultado</button></div>';
      var q = new URLSearchParams();
      if (nome) q.set("produto", nome); if (de) q.set("de", de); q.set("por", por); q.set("normal", normal);
      history.replaceState(null, "", "#detector?" + q.toString());
    };
    det.addEventListener("submit", function (e) { e.preventDefault(); analisa(true); });
    det.addEventListener("click", function (e) {
      if (e.target.matches("[data-copiar]")) {
        navigator.clipboard && navigator.clipboard.writeText(location.href).then(function () { e.target.textContent = "Link copiado \u2713"; });
      }
    });
    var botaoEx = document.querySelector("[data-exemplo]");
    if (botaoEx) botaoEx.addEventListener("click", function () {
      cProd.value = "Smart TV 55\u201d 4K (exemplo)"; cDe.value = "5.999"; cPor.value = "2.999"; cNormal.value = "2.899";
      atualizaLink(); analisa(true); det.scrollIntoView({ behavior: semMovimento ? "auto" : "smooth", block: "start" });
    });
    var h = location.hash.split("?")[1];
    if (h) {
      var p = new URLSearchParams(h);
      if (p.get("por")) {
        cProd.value = p.get("produto") || ""; cDe.value = p.get("de") || ""; cPor.value = p.get("por"); cNormal.value = p.get("normal") || "";
        atualizaLink(); analisa(true);
      }
    }
  }

  /* ---------- entrada suave das seções ---------- */
  var surgem = document.querySelectorAll(".surge");
  if ("IntersectionObserver" in window && !semMovimento) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("vis"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    surgem.forEach(function (s) { io.observe(s); });
  } else { surgem.forEach(function (s) { s.classList.add("vis"); }); }

  /* balões do celular aparecem um a um */
  var cel = document.querySelector("[data-celular]");
  if (cel) {
    var baloes = cel.querySelectorAll(".balao");
    var solta = function () { baloes.forEach(function (b, k) { setTimeout(function () { b.classList.add("vis"); }, semMovimento ? 0 : 400 + k * 900); }); };
    if ("IntersectionObserver" in window) {
      var io2 = new IntersectionObserver(function (ents) { if (ents[0].isIntersecting) { solta(); io2.disconnect(); } }, { threshold: .3 });
      io2.observe(cel);
    } else solta();
  }

  /* barra do Telegram no celular aparece depois do herói */
  var barra = document.querySelector(".barra-cel");
  if (barra) {
    var mostraBarra = function () { barra.classList.toggle("vis", window.scrollY > 520); };
    window.addEventListener("scroll", mostraBarra, { passive: true }); mostraBarra();
  }

  /* ---------- vitrine: busca, filtros e ordem ---------- */
  var vitrine = document.querySelector("[data-vitrine]");
  if (vitrine) {
    var cards = Array.prototype.slice.call(vitrine.querySelectorAll("[data-card]"));
    var busca = document.querySelector("[data-busca]"), ordem = document.querySelector("[data-ordem]");
    var chips = document.querySelectorAll("[data-filtro]"), contador = document.querySelector("[data-contador]");
    var vazio = document.querySelector("[data-vazio]");
    var filtroCat = "todas", filtroSelo = "todos";
    var normaliza = function (s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
    var aplica = function () {
      var termo = normaliza(busca ? busca.value : "");
      var vis = 0;
      cards.forEach(function (c) {
        var ok = (filtroCat === "todas" || c.dataset.cat === filtroCat) && (filtroSelo === "todos" || c.dataset.selo === filtroSelo) &&
                 (!termo || normaliza(c.dataset.nome).indexOf(termo) >= 0);
        c.hidden = !ok; if (ok) vis++;
      });
      if (contador) contador.textContent = vis + (vis === 1 ? " produto" : " produtos");
      if (vazio) vazio.hidden = vis > 0;
    };
    var ordena = function () {
      var k = ordem.value;
      cards.sort(function (a, b) {
        if (k === "preco") return +a.dataset.preco - +b.dataset.preco;
        if (k === "economia") return +b.dataset.economia - +a.dataset.economia;
        return +a.dataset.rank - +b.dataset.rank;
      }).forEach(function (c) { vitrine.appendChild(c); });
    };
    chips.forEach(function (ch) {
      ch.addEventListener("click", function () {
        var tipo = ch.dataset.filtro;
        document.querySelectorAll('[data-filtro="' + tipo + '"]').forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
        ch.setAttribute("aria-pressed", "true");
        if (tipo === "cat") filtroCat = ch.dataset.valor; else filtroSelo = ch.dataset.valor;
        aplica();
      });
    });
    if (busca) busca.addEventListener("input", aplica);
    if (ordem) ordem.addEventListener("change", ordena);
    var qs = new URLSearchParams(location.search);
    if (busca && qs.get("q")) busca.value = qs.get("q");
    if (qs.get("cat")) { var chipCat = document.querySelector('[data-filtro="cat"][data-valor="' + qs.get("cat") + '"]'); if (chipCat) chipCat.click(); }
    aplica();
  }

  /* ---------- gráfico do produto: dica ao passar o mouse ---------- */
  document.querySelectorAll("[data-grafico]").forEach(function (g) {
    var pts = JSON.parse(g.getAttribute("data-pontos"));
    var svg = g.querySelector("svg"), dica = g.querySelector(".dica-graf"), cursor = g.querySelector("[data-cursor]");
    var vb = svg.viewBox.baseVal;
    var move = function (ev) {
      var r = svg.getBoundingClientRect();
      var x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      var vx = x / r.width * vb.width;
      var melhor = pts[0], dist = 1e9;
      pts.forEach(function (p) { var d = Math.abs(p[2] - vx); if (d < dist) { dist = d; melhor = p; } });
      cursor.setAttribute("cx", melhor[2]); cursor.setAttribute("cy", melhor[3]); cursor.style.opacity = 1;
      dica.style.left = (melhor[2] / vb.width * r.width) + "px";
      dica.style.top = (melhor[3] / vb.height * r.height) + "px";
      dica.textContent = melhor[0] + " · " + reais(melhor[1]);
      dica.style.opacity = 1;
    };
    svg.addEventListener("mousemove", move); svg.addEventListener("touchmove", move, { passive: true });
    svg.addEventListener("mouseleave", function () { dica.style.opacity = 0; cursor.style.opacity = 0; });
  });
})();
