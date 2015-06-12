import {metadata, config} from "../index";

function swapNames(name) {
  const comma = name.indexOf(',');
  if (~comma) {
    let ln = name.substring(0, comma),
        fn = name.substring(comma + 1).trim();
    return `${fn} ${ln}`;
  } else {
    let sep = name.lastIndexOf(' '),
        fn = name.substring(0, sep),
        ln = name.substring(sep + 1).trim();
    return `${ln}, ${fn}`;
  }
}

function insertAfter(doc, locator, str) {
  const i = doc.indexOf(locator) + locator.length;
  return doc.substr(0, i) + str + doc.substr(i, doc.length);
}

function insertBefore(doc, locator, str) {
  const i = doc.indexOf(locator);
  return doc.substr(0, i) + str + doc.substr(i, doc.length);
}

const transformers = {

  html: {

    smallCaps: doc => doc.replace(/(?:<span class=("|')small-caps(?:[\s]*|[\s]char-style-override-\d)\1>)([^<]+)(?:<\/span>)/g,
      (match, g1, g2, offset, str) => match.replace(g2, g2.toUpperCase())
    )

  },

  css: {
    //
  },

  opf: {

    title: doc => {
      if (!metadata) return doc;

      const newTitle = `<dc:title>${metadata.Title}${(
        metadata.Subtitle ?
          (': ' + metadata.Subtitle) :
          ''
        )}</dc:title>`;

      if (doc.includes('<dc:title />')) return doc.replace('<dc:title />', newTitle);
      else if (doc.includes("<dc:title></dc:title>")) return doc.replace("<dc:title></dc:title>", newTitle);
      else if (!doc.includes('<dc:title>')) return insertBefore(doc, '</metadata>', '\t' + newTitle + '\n\t');
      else return doc;
    },

    ISBN: doc => {
      var newISBN = '<dc:identifier xmlns:opf="http://www.idpf.org/2007/opf" opf:scheme="ISBN">' +
        metadata['eBook ISBN'] +
        '</dc:identifier>';

      if (!metadata['eBook ISBN']) return doc;
      if (!doc.includes(newISBN)) return insertBefore(doc, '</metadata>', '\t' + newISBN + '\n\t');
      else return doc;
    },

    author: doc => {
      if (!metadata['Author (First, Last)']) return doc;

      const newAuthor = `<dc:creator xmlns:opf="http://www.idpf.org/2007/opf" opf:file-as="${
        swapNames(metadata['Author (First, Last)'])
      }" opf:role="aut">${
        metadata['Author (First, Last)']
      }</dc:creator>`;

      if (doc.includes('<dc:creator />')) return doc.replace('<dc:creator />', newAuthor);
      else if (doc.includes("<dc:creator></dc:creator>")) return doc.replace("<dc:creator></dc:creator>", newAuthor);
      else if (!doc.includes('<dc:creator>')) return insertBefore(doc, '</metadata>', '\t' + newAuthor + '\n\t');
      else return doc;
    },

    otherContribs: doc => {
      const abbrevTypes = ['edt', 'ill', 'trl'],
            rawTypes = ['Editor', 'Illustrator', 'Translator'],
            verboseTypes = rawTypes.map(function(str) {
              return str + ' (First, Last)';
            });

      var res = doc;

      if (!metadata) return doc;

      for (let i = 0, l = verboseTypes.length; i < l; i++) {
        if (metadata[verboseTypes[i]]) {
          res = insertBefore(res, '</metadata>',
            '\t<dc:contributor xmlns:opf="http://www.idpf.org/2007/opf" opf:file-as="' +
            swapNames(metadata[verboseTypes[i]]) + '" opf:role="' +
            abbrevTypes[i] + '">' +
            metadata[verboseTypes[i]] +
            '</dc:contributor>' + '\n\t'
          );
        }
      }
      return res;
    }
  }
};

export default transformers;
