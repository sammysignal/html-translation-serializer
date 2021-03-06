// function htmlToParsedHTMLObject(domElement, object, templateLeft, templateRight) {
//   var currentIndexString = "$#^" + String(window.index) + "^#$";
//   var children = domElement.children;
//   // put this level strings in the object
//   object[currentIndexString] = getTextDirectlyBelowElement(domElement);
//   window.index++;
//   for (var i = 0; i < children.length; i++) {
//     // recurse
//     htmlToParsedHTMLObject(children[i], object)
//   }
// }
// http://bililite.com/blog/blogfiles/prism/prismeditor.html
// from https://stackoverflow.com/questions/2474605/how-to-convert-a-htmlelement-to-a-string
document.getHTMLString = function(who, deep){
    if(!who || !who.tagName) return '';
    var txt, ax, el= document.createElement("div");
    el.appendChild(who.cloneNode(false));
    txt= el.innerHTML;
    if(deep){
        ax= txt.indexOf('>')+1;
        txt= txt.substring(0, ax)+who.innerHTML+ txt.substring(ax);
    }
    el= null;
    return txt;
}
// from https://medium.com/@roxeteer/javascript-one-liner-to-get-elements-text-content-without-its-child-nodes-8e59269d1e71
function getTextDirectlyBelowElement(parentElement) {
  return [].reduce.call(parentElement.childNodes, function(a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, '');
}

window.elStack = [];

function stringsObjectToString(stringsObject) {
  var finalString = "";
  var keys = Object.keys(stringsObject);
  var value, key;
  for (var i = 0; i < keys.length; i++) {
    key = keys[i]
    value = stringsObject[key]
    finalString = finalString + "$$##" + i + "##" + value + "##$$\n";
  }
  return finalString;
}

function stringToStringsObject(s) {
  var newObject = {};
  var pieces = s.split("$$");
  var piece, index, value, piecePortions;
  for (var i = 0; i < pieces.length; i++) {
    piece = pieces[i]
    if (piece.length >= 9) {
      piecePortions = piece.split("##");
      index = piecePortions[1];
      value = piecePortions[2];
      newObject[index] = value;
    }
  }
  return newObject;
}

// index = integer
function indexToPlaceholder(index) {
  return "##" + index + "##";
}

//difficult
function getTemplateAndStringList(htmlString) {
  var template = "";
  var newStringObject = {};
  var index = 0;
  flags = {
    inTag: false,
    inStartTag: false,
    inEndTag: false,
  };
  var tagName = "";
  var currentString = "";
  var char;
  for (var i = 0; i < htmlString.length; i++) {
    char = htmlString[i];
    // write to template or currentString
    if (flags.inTag) {
      if (char === '>') {
        window.elStack.push(tagName);
        tagName = "";
      } else if (char !== '/') {
        tagName = tagName + char;
      }
      template = template + char;
    } else if (char !== '<') {
      currentString = currentString + char;
    }
    if (char === '<' && !flags.inStartTag && !flags.inEndTag) {
      newStringObject[String(index)] = currentString;
      template = template + indexToPlaceholder(index) + '<';
      index++;
    }
    // update flags
    flags = updateFlags(flags, char);
  }
  return {
    "template": template,
    "strings": stringsObjectToString(newStringObject)
  }
}
function updateFlags(flags, char) {
  var newFlags = JSON.parse(JSON.stringify(flags));
  if (flags.inTag && char === '>') {
    newFlags.inTag = false;
    newFlags.inStartTag = false;
    newFlags.inEndTag = false;
  }
  if (flags.inTag && char === '>' && flags.inStartTag) {
    newFlags.inStartTag = false;
  }
  if (flags.inTag && char === '>' && flags.inEndTag) {
    newFlags.inEndTag = false;
  }
  if (char === '/' && flags.inTag) {
    newFlags.inEndTag = true
  }
  if (char === '<' && !flags.inStartTag && !flags.inEndTag && !flags.inTag) {
    newFlags.inTag = true;
  }
  return newFlags;
}

//easy
function getHtml(template, s) {
  var templateCopy = String(template);
  var stringObject = stringToStringsObject(s);
  var keys = Object.keys(stringObject);
  var value, key, regex;
  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    value = stringObject[key];
    templateCopy = templateCopy.replace('##'+key+'##', value);
  }
  return templateCopy;
}
function updateHtmlFromStringList(stringsEl, htmlEl, templateEl) {
  var html = getHtml(templateEl.value, stringsEl.value);
  htmlEl.value = html;
}
function updateStringListFromHtml(htmlEl, stringsEl, templateEl) {
  var templateAndStringsObject = getTemplateAndStringList(htmlEl.value)
  templateEl.value = templateAndStringsObject['template'];
  stringsEl.value = templateAndStringsObject['strings'];
}
function onChangeItem(e) {
  var templateEl = document.querySelector('.template');
  if (e.target.classList.contains('html')) {
    var stringsArea = document.querySelector('.strings');
    updateStringListFromHtml(e.target, stringsArea, templateEl);
  } else if (e.target.classList.contains('strings')) {
    var htmlArea = document.querySelector('.html');
    updateHtmlFromStringList(e.target, htmlArea, templateEl);
  }
}

var main = function() {
  // set trim method
  if (!('trim' in String.prototype)) {
    String.prototype.trim= function() {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };
  }
  var items = document.querySelectorAll('.editable');
  items.forEach(function (object) {
    object.addEventListener("change", onChangeItem);
  })
}

window.onload = function() {
  main();
}