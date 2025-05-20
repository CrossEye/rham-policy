// Usage `node makeTiddlers > tiddlers.json`

const policies = require('./RawData/policies.json')
const tocs = require('./RawData/tocs.json')

const convertPol = ({title, url}) => {
  const [key, _title] = title.split(' - ')
  const [first, ...rest] = key.split(/,\s*/)
  return [
    {
      title: `Policy${first}`,
      tags: `Policy Section${first.slice(0,1)}000`,
      'policy-nbr': first, 
      caption: `${first} - ${_title}`, 
      description: _title,
      section: `Section${first.slice(0,1)}000`,
      'pdf-url': url
    },
    ...rest.map((nbr) => ({
      title: `Policy${nbr}`,
      tags: `PolicyAlias Section${nbr.slice(0,1)}000`,
      'alias-of': `Policy${first}`,
      'policy-nbr': nbr, 
      caption: `${nbr} - ${_title}`, 
      description: _title, 
      section: `Section${first.slice(0,1)}000`,
      'pdf-url': url
    }))
  ] 
}

const byTitle = ({title: a}, {title: b}) => a < b ? -1 : a > b ? 1 : 0

const convertToc = (({title, url}) => ({
  title: `Section${title.slice(9, 13)}`,
  tags: 'Section TableOfContents',
  caption: `${title.slice(9, 13)} - ${title.slice(33)}`,
  description: title.slice(33),
  'pdf-uel': url
}))

console.clear()

console.log(JSON.stringify([
  ...policies.flatMap(convertPol),
  ...tocs.map(convertToc)
].sort(byTitle) , null, 4))