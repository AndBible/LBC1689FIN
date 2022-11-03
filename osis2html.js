import { JSDOM } from "jsdom";
import fs from "fs";

// etsi kaikki divit (chapter). Niistä tehdään omia dokumentteja.
// toc / next / prev -linkit
// Muunna kaikki referencet. Muuta kaikki notet <div class="note">...</div>


const toLink = ref => {
    return `https://www.stepbible.org/?q=version=FinPR|reference=${ref}`;
};

function convert() {
    const file = fs.readFileSync("LBCF1689FIN.xml", "utf8");
    const jsdom = new JSDOM(file, {contentType: "text/xml"});

    const window = jsdom.window;
    const doc = window.document;
    for(const r of doc.querySelectorAll("reference")) {
        const a = doc.createElement("a");
        a.setAttribute("href", toLink(r.getAttribute("osisRef")));
        a.setAttribute("target", "_blank");
        a.appendChild(r.firstChild);
        for(const n of Array.from(r.childNodes)) {
            n.parentNode.removeChild(n);
            a.appendChild(n);
        }
        r.parentNode.replaceChild(a, r);
    }
    for(const r of doc.querySelectorAll("title")) {
        const div = doc.createElement("div");
        div.classList.add("title");
        div.appendChild(r.firstChild);
        r.parentNode.replaceChild(div, r);
    }
    for(const l of doc.querySelectorAll("list")) {
        const ul = doc.createElement("ul");
        for(const n of Array.from(l.childNodes)) {
            n.parentNode.removeChild(n);
            ul.appendChild(n);
        }
        l.parentNode.replaceChild(ul, l);
    }
    for(const itm of doc.querySelectorAll("item")) {
        const li = doc.createElement("li");
        for(const n of Array.from(itm.childNodes)) {
            n.parentNode.removeChild(n);
            li.appendChild(n);
        }
        itm.parentNode.replaceChild(li, itm);
    }
    for(const n of doc.querySelectorAll("note")) {
        const span = doc.createElement("span");
        span.classList.add("note");
        for(const c of Array.from(n.childNodes)) {
            c.parentNode.removeChild(c);
            span.appendChild(c);
        }
        n.parentNode.replaceChild(span, n);
    }

    const chapters = doc.querySelectorAll('div[type="chapter"]')

    const filenames = new Map(Array.from(chapters).map(c => {
        const osisID = c.getAttribute("osisID");
        return [osisID, `${osisID.replace(/[ äöÄÖ]/g, "_")}.html`];
    }));
    const fileNamesList = Array.from(filenames.keys());
    const toc = [];
    function getFooter() {
        const footerText = `<div class="footer">
© 2021 Agricola teologinen instituutti ja tekijät<br>
Kirja saatavilla paperiversiona kirjakaupoista, esim. <a href="https://www.adlibris.com/fi/kirja/1689-lontoon-baptistien-uskontunnustus-ja-baptistikatekismus-vuodelta-1693-9789526976709">Ad Libris</a>. <br>
Voit lukea kirjaa kätevästi myös Android-laitteellasi <a href="https://play.google.com/store/apps/details?id=net.bible.android.activity">AndBible -sovelluksella</a>. <br>
Lähdekoodit ja jakelulupatiedot <a href="https://github.com/AndBible/LBCF1689FIN">Githubissa</a>.</div>`
        const footer = new JSDOM(footerText);
        return footer.window.document.body.firstChild;
    }


    for(const chap of chapters) {
        chap.classList.add("chapter")
        const osisID = chap.getAttribute("osisID");
        const filename = filenames.get(osisID);
        const idx = fileNamesList.findIndex(v => v === osisID);
        const prev = filenames.get(fileNamesList[idx-1]);
        const next = filenames.get(fileNamesList[idx+1]);
        const html = new JSDOM(`<div class="nav"><span class="prev"><a href="${prev}">&larr;</a></span><span class="index"><a href="index.html">Sisällys</a></span><span class="next"><a href="${next}">&rarr;</a></span></div>`);
        const htmlDoc = html.window.document;
        htmlDoc.documentElement.appendChild(chap);
        htmlDoc.documentElement.appendChild(getFooter());
        const title = htmlDoc.createElement("title");
        const titleText = chap.querySelector("div.title").textContent;
        toc.push({filename, titleText});
        title.appendChild(htmlDoc.createTextNode(titleText));
        htmlDoc.head.appendChild(title)
        const css = htmlDoc.createElement("link");
        css.setAttribute("type", "text/css");
        css.setAttribute("rel", "stylesheet");
        css.setAttribute("href", "style.css");
        htmlDoc.head.appendChild(css);
        const utf8 = htmlDoc.createElement("meta");
        utf8.setAttribute("charset","UTF-8");
        htmlDoc.head.appendChild(utf8);

        //console.log({filename, cont: htmlDoc.documentElement.outerHTML});
        fs.writeFileSync("html/" + filename, htmlDoc.documentElement.outerHTML);
    }

    const html = new JSDOM(`<div class='title'>1689 Lontoon baptistien uskontunnustus ja baptistikatekismus vuodelta 1693</div><ul></ul>`);
    const htmlDoc = html.window.document;
    const ul = htmlDoc.querySelector("ul");
    for(const {filename, titleText} of toc) {
        const li = htmlDoc.createElement("li");
        const a = htmlDoc.createElement("a");
        a.setAttribute("href", filename);
        a.appendChild(htmlDoc.createTextNode(titleText));
        li.appendChild(a);
        ul.appendChild(li);


        const title = htmlDoc.createElement("title");
        title.appendChild(htmlDoc.createTextNode("Sisällys"));
        htmlDoc.head.appendChild(title)
        const css = htmlDoc.createElement("link");
        css.setAttribute("type", "text/css");
        css.setAttribute("rel", "stylesheet");
        css.setAttribute("href", "style.css");
        htmlDoc.head.appendChild(css);
        const utf8 = htmlDoc.createElement("meta");
        utf8.setAttribute("charset","UTF-8");
        htmlDoc.head.appendChild(utf8);

        //console.log({filename, cont: htmlDoc.documentElement.outerHTML});
    }
    htmlDoc.documentElement.appendChild(getFooter());
    fs.writeFileSync("html/index.html", htmlDoc.documentElement.outerHTML);
}

convert();