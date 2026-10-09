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

  /* ---------- índice do Radar: o mesmo para a busca e para o Detector ---------- */
  var DIAS_SELO = 14; // o selo e o "preço normal" só saem com 14 dias de histórico
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var Radar = (function () {
    var indice = null, carregando = null, vocab = {};
    var norm = function (s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
    var limpa = function (s) { return norm(s).replace(/[^a-z0-9]+/g, " ").trim(); };
    var apelidos = function (b) { return b + " " + b.replace(/playstation\s?(\d)/g, "ps$1").replace(/nintendo\s/g, "").replace(/\s(\d+)\s(gb|tb)/g, " $1$2"); };
    var carrega = function () {
      if (indice) return Promise.resolve(indice);
      if (!carregando) {
        carregando = fetch("/static/busca.json").then(function (r) { return r.json(); }).then(function (j) {
          indice = j.map(function (x) {
            x._n = apelidos(limpa(x.n + " " + x.c));
            x._n.split(" ").forEach(function (w) { if (w.length >= 3) vocab[w] = (vocab[w] || 0) + 1; });
            return x;
          });
          return indice;
        }).catch(function () { indice = []; return indice; });
      }
      return carregando;
    };
    /* distância de edição; trocar duas letras vizinhas ("smasung") conta como 1 erro */
    var distancia = function (a, b) {
      var d = [], i, j;
      for (i = 0; i <= a.length; i++) d[i] = [i];
      for (j = 1; j <= b.length; j++) d[0][j] = j;
      for (i = 1; i <= a.length; i++) {
        for (j = 1; j <= b.length; j++) {
          d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
          if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
      return d[a.length][b.length];
    };
    /* palavra com erro de digitação: a palavra do Radar mais parecida, inteira ou o começo dela ("samsumg" -> "samsung") */
    var corrige = function (t) {
      var lim = t.length >= 8 ? 2 : t.length >= 4 ? 1 : 0, melhor = null, md = lim + 1, mf = 0;
      if (!lim) return null;
      Object.keys(vocab).forEach(function (w) {
        if (w.length < t.length - lim) return;
        var cands = [w];
        if (w.length > t.length) cands.push(w.slice(0, t.length - 1), w.slice(0, t.length), w.slice(0, t.length + 1));
        cands.forEach(function (c) {
          if (c.length < 3) return;
          var dd = distancia(t, c);
          if (dd < md || (dd === md && vocab[w] > mf)) { md = dd; mf = vocab[w]; melhor = { busca: c, palavra: w }; }
        });
      });
      return md <= lim ? melhor : null;
    };
    var acha = function (termos) {
      return indice.filter(function (x) { return termos.every(function (t) { return x._n.indexOf(t) >= 0; }); })
        .sort(function (a, b) { return (a._n.indexOf(termos[0]) - b._n.indexOf(termos[0])) || (a.n.length - b.n.length); });
    };
    var busca = function (q, max) {
      var termos = limpa(q).split(" ").filter(Boolean), itens = acha(termos), corrigido = null;
      if (!itens.length) {
        var novos = [], mostra = [], trocou = false;
        for (var k = 0; k < termos.length && novos; k++) {
          var t = termos[k];
          if (indice.some(function (x) { return x._n.indexOf(t) >= 0; })) { novos.push(t); mostra.push(t); continue; }
          var c = corrige(t);
          if (c) { novos.push(c.busca); mostra.push(c.palavra); trocou = true; } else novos = null;
        }
        if (novos && trocou) {
          var achados = acha(novos);
          if (achados.length) { itens = achados; termos = novos; corrigido = mostra.join(" "); }
        }
      }
      return { itens: itens.slice(0, max || 8), termos: termos, corrigido: corrigido };
    };
    return { carrega: carrega, busca: busca, norm: norm, limpa: limpa };
  })();

  /* ---------- lista de sugestões (a mesma na busca e no Detector) ---------- */
  var ligaSugestoes = function (campo, lista, opcoes) {
    var sel = -1, itens = [], pref = lista.id + "-";
    var realca = function (nome, termos) {
      var h = esc(nome);
      termos.forEach(function (t) {
        if (t.length < 2) return;
        var i = Radar.norm(h).indexOf(t);
        if (i >= 0) h = h.slice(0, i) + "<mark>" + h.slice(i, i + t.length) + "</mark>" + h.slice(i + t.length);
      });
      return h;
    };
    var fecha = function () { lista.hidden = true; campo.setAttribute("aria-expanded", "false"); campo.removeAttribute("aria-activedescendant"); sel = -1; };
    var mostra = function () {
      if (Radar.limpa(campo.value).length < 3) { fecha(); return; }
      var r = Radar.busca(campo.value, 8);
      itens = r.itens;
      if (!itens.length) {
        lista.innerHTML = '<li class="bs-vazio">' + opcoes.vazio(esc(campo.value.trim())) + "</li>";
      } else {
        lista.innerHTML = (r.corrigido ? '<li class="bs-dica">Mostrando resultados para <b>' + esc(r.corrigido) + "</b></li>" : "") +
          itens.map(function (x, k) {
            return '<li role="option" id="' + pref + k + '" data-k="' + k + '"><img src="' + esc(x.i) + '" alt="" loading="lazy">' +
              '<span class="bs-nome">' + realca(x.n, r.termos) + '<span class="bs-cat">' + esc(x.c) + "</span></span>" +
              '<span class="bs-preco">' + (x.p ? reais(x.p) + "<small>hoje no " + esc(x.l) + "</small>" : "<small>preço na loja</small>") + "</span></li>";
          }).join("");
      }
      lista.hidden = false; campo.setAttribute("aria-expanded", "true"); sel = -1;
    };
    var escolhe = function (k) { if (itens[k]) { fecha(); opcoes.escolhe(itens[k]); } };
    campo.addEventListener("focus", function () { Radar.carrega(); });
    campo.addEventListener("input", function () { Radar.carrega().then(mostra); });
    campo.addEventListener("blur", function () { setTimeout(fecha, 150); });
    campo.addEventListener("keydown", function (e) {
      if (lista.hidden) return;
      if (e.key === "Escape") { fecha(); return; }
      var lis = lista.querySelectorAll("li[role=option]");
      if (!lis.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + lis.length) % lis.length;
        lis.forEach(function (li, i) { li.setAttribute("aria-selected", i === sel ? "true" : "false"); });
        campo.setAttribute("aria-activedescendant", pref + sel);
        lis[sel].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") { e.preventDefault(); escolhe(sel >= 0 ? sel : 0); }
    });
    // o foco fica no campo (a lista não fecha antes do clique); o link do Telegram na lista continua funcionando
    lista.addEventListener("mousedown", function (e) { e.preventDefault(); var li = e.target.closest("li[data-k]"); if (li) escolhe(+li.dataset.k); });
  };

  /* ---------- busca da página inicial e das ofertas ---------- */
  var auto = document.querySelector("[data-autocomplete]");
  if (auto) ligaSugestoes(auto.querySelector("input"), auto.querySelector(".busca-sugestoes"), {
    escolhe: function (x) { location.href = "/" + x.s + "/"; },
    vazio: function (q) { return "Ainda não vigiamos “" + q + '”. Peça no <a href="https://t.me/promocaosempapo">Telegram</a> que a gente põe no radar.'; }
  });

  /* ---------- detector de desconto falso ---------- */
  var det = document.querySelector("[data-detector]");
  if (det) {
    var cProd = det.querySelector("[name=produto]"), cDe = det.querySelector("[name=de]"),
        cPor = det.querySelector("[name=por]"), cNormal = det.querySelector("[name=normal]");
    var saida = det.querySelector("[data-veredito]"), linkHist = det.querySelector("[data-historico]");
    var cartao = det.querySelector("[data-radar-produto]"), notaNormal = det.querySelector("[data-nota-normal]");
    var escolhido = null, normalAuto = "";
    var temHist = function (x) { return x && x.d >= DIAS_SELO && x.m > 0; };
    var quandoTxt = function (iso) { // sempre no horário de Brasília, como o resto do site
      var d = new Date(iso);
      if (isNaN(d)) return "";
      var fmt = function (x, o) { o.timeZone = "America/Sao_Paulo"; return x.toLocaleString("pt-BR", o); };
      var diaDe = function (x) { return fmt(x, { day: "2-digit", month: "2-digit" }); };
      var dia = diaDe(d) === diaDe(new Date()) ? "hoje" : diaDe(d) === diaDe(new Date(Date.now() - 864e5)) ? "ontem" : diaDe(d);
      return dia + " às " + fmt(d, { hour: "numeric", minute: "2-digit", hourCycle: "h23" }).replace(":00", "h").replace(":", "h");
    };
    var linkLoja = function (x, texto) {
      return '<a href="' + esc(x.u) + '" target="_blank" rel="' + (x.a ? "sponsored noopener" : "nofollow noopener") + '">' + texto + " ↗</a> <small>" +
        (x.a ? "#publi · link de afiliado" : "link direto, sem comissão") + "</small>";
    };
    var atualizaLink = function () {
      if (temHist(escolhido)) {
        linkHist.href = "/" + escolhido.s + "/"; linkHist.removeAttribute("target");
        linkHist.textContent = "Ver o histórico completo no Radar →";
        return;
      }
      var n = cProd.value.trim();
      linkHist.target = "_blank";
      linkHist.href = n ? "https://www.google.com/search?tbm=shop&q=" + encodeURIComponent(n) : "https://shopping.google.com/";
      linkHist.textContent = n ? "Não sabe? Ver o histórico de preço de “" + (n.length > 28 ? n.slice(0, 28) + "…" : n) + "” ↗" : "Não sabe? Ver o histórico de preço deste produto ↗";
    };
    var limpaEscolha = function () {
      escolhido = null; cartao.hidden = true; cartao.innerHTML = "";
      if (normalAuto && cNormal.value === normalAuto) cNormal.value = "";
      normalAuto = ""; notaNormal.hidden = true;
    };
    var analisa = function (anima) {
      var nome = cProd.value.trim(), de = lerReais(cDe.value), por = lerReais(cPor.value), normal = lerReais(cNormal.value);
      if (!(por > 0)) {
        saida.innerHTML = '<p class="vazio">Coloque pelo menos o preço de agora.</p>'; cPor.focus(); return;
      }
      var compara = "";
      if (escolhido && escolhido.p) {
        compara = escolhido.p < por - 0.5
          ? '<p class="mais-barato">Achamos mais barato: <b>' + reais(escolhido.p) + "</b> no " + esc(escolhido.l) + " (" + quandoTxt(escolhido.t) + "). " + linkLoja(escolhido, "Ver oferta") + "</p>"
          : '<p class="mais-barato ok">O seu preço é igual ou menor que o do ' + esc(escolhido.l) + " hoje (" + reais(escolhido.p) + ").</p>";
      }
      if (!(normal > 0)) {
        saida.innerHTML = (de > por ? '<div class="numeros"><div><small>Desconto anunciado</small><b>' + pct(1 - por / de) + "</b></div></div>" : "") +
          '<p>Falta o <b>quanto ele costumava custar</b>. Sem isso, não dá para saber se o desconto é real: o “de” pode ter sido inventado. ' +
          (escolhido ? "No nosso Radar, esse produto ainda está em observação (" + escolhido.d + (escolhido.d === 1 ? " dia" : " dias") + " de histórico). " : "") +
          'Use o link “ver o histórico” logo acima.</p>' + compara;
        cNormal.focus(); return;
      }
      var anunciado = de > por ? 1 - por / de : 0;
      var real = 1 - por / normal;
      var deInflado = de > 0 && de >= normal * 1.25;
      var selo, cor, texto;
      if (real >= 0.15) {
        selo = "Preço real"; cor = "verde";
        texto = "Está " + reais(normal - por) + " abaixo do que costumava custar. Desconto de verdade." +
          (deInflado ? " Só ignore o percentual da loja: o “de” é inflado, e o desconto real é " + pct(real) + "." : "");
      } else if (deInflado) {
        selo = "Maquiado"; cor = "";
        texto = "O “de” de " + reais(de) + " é " + pct(de / normal - 1) + " maior do que o produto costumava custar. O desconto anunciado não existe.";
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
        (nome ? '<span class="produto-checado">' + esc(nome) + "</span>" : "") +
        '<span class="carimbo ' + cor + (anima ? " bate" : "") + '">' + selo + "</span>" +
        '<div class="numeros"><div class="' + (anunciado > real + 0.05 ? "falso" : "") + '"><small>Desconto anunciado</small><b>' + (de > por ? pct(anunciado) : "—") + "</b></div>" +
        '<div class="real"><small>Desconto real</small><b>' + (real > 0 ? pct(real) : "0%") + "</b></div></div>" +
        "<p>" + texto + "</p>" + compara +
        '<div class="acoes-detector"><button type="button" data-copiar>Copiar link do resultado</button></div>';
      var q = new URLSearchParams();
      if (nome) q.set("produto", nome); if (de) q.set("de", de); q.set("por", por); q.set("normal", normal);
      history.replaceState(null, "", "#detector?" + q.toString());
    };
    var seleciona = function (x, semFoco) {
      escolhido = x;
      cProd.value = x.n;
      var hist = temHist(x);
      cartao.innerHTML = '<img src="' + esc(x.i) + '" alt="">' + "<div><b>" + esc(x.n) + "</b>" +
        (x.p ? '<span class="rp-hoje">Hoje: <strong>' + reais(x.p) + "</strong> no " + esc(x.l) + " · " + quandoTxt(x.t) + "</span>" : "") +
        '<span class="rp-hist">' + (hist
          ? "Costuma custar " + reais(Math.round(x.m)) + " · menor preço em " + x.d + " dias: " + reais(x.mn)
          : "Em observação: " + x.d + (x.d === 1 ? " dia" : " dias") + " de histórico no Radar. O preço normal sai com " + DIAS_SELO + " dias.") + "</span>" +
        '<span class="rp-links">' + linkLoja(x, "Ver no " + esc(x.l)) + ' <a href="/' + esc(x.s) + '/">Histórico</a></span></div>';
      cartao.hidden = false;
      if (hist && !cNormal.value.trim()) {
        cNormal.value = normalAuto = Math.round(x.m).toLocaleString("pt-BR");
        notaNormal.textContent = "Preenchido com o preço mediano de " + x.d + " dias no nosso Radar. Pode trocar.";
        notaNormal.hidden = false;
      }
      atualizaLink();
      if (semFoco) return;
      if (cPor.value.trim() && cNormal.value.trim()) analisa(true);
      else (cPor.value.trim() ? cNormal : cPor).focus();
    };
    ligaSugestoes(cProd, det.querySelector(".busca-sugestoes"), {
      escolhe: function (x) { seleciona(x); },
      vazio: function (q) { return "Ainda não vigiamos “" + q + "”. Dá para checar do mesmo jeito: preencha os preços abaixo."; }
    });
    cProd.addEventListener("input", function () { if (escolhido && cProd.value !== escolhido.n) limpaEscolha(); atualizaLink(); });
    cNormal.addEventListener("input", function () { if (cNormal.value !== normalAuto) notaNormal.hidden = true; });
    det.addEventListener("submit", function (e) { e.preventDefault(); analisa(true); });
    det.addEventListener("click", function (e) {
      if (e.target.matches("[data-copiar]")) {
        navigator.clipboard && navigator.clipboard.writeText(location.href).then(function () { e.target.textContent = "Link copiado ✓"; });
      }
    });
    var botaoEx = document.querySelector("[data-exemplo]");
    if (botaoEx) botaoEx.addEventListener("click", function () {
      limpaEscolha();
      cProd.value = "Smart TV 55” 4K (exemplo)"; cDe.value = "5.999"; cPor.value = "2.999"; cNormal.value = "2.899";
      atualizaLink(); analisa(true); det.scrollIntoView({ behavior: semMovimento ? "auto" : "smooth", block: "start" });
    });
    var h = location.hash.split("?")[1];
    if (h) {
      var p = new URLSearchParams(h);
      if (p.get("por")) {
        cProd.value = p.get("produto") || ""; cDe.value = p.get("de") || ""; cPor.value = p.get("por"); cNormal.value = p.get("normal") || "";
        atualizaLink(); analisa(true);
        if (cProd.value) Radar.carrega().then(function (ind) {
          var x = ind.filter(function (y) { return y.n === cProd.value; })[0];
          if (x) { seleciona(x, true); analisa(false); }
        });
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
    var normaliza = function (s) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); };
    var apelidos = function (b) { return b + " " + b.replace(/playstation\s?(\d)/g, "ps$1").replace(/nintendo\s/g, "").replace(/\s(\d+)\s(gb|tb)/g, " $1$2"); };
    cards.forEach(function (c) { c._n = apelidos(normaliza(c.dataset.nome || "")); });
    var aplica = function () {
      var termos = normaliza(busca ? busca.value : "").split(" ").filter(Boolean);
      var vis = 0;
      cards.forEach(function (c) {
        var ok = (filtroCat === "todas" || c.dataset.cat === filtroCat) && (filtroSelo === "todos" || c.dataset.selo === filtroSelo) &&
                 (!termos.length || termos.every(function (t) { return c._n.indexOf(t) >= 0; }));
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
