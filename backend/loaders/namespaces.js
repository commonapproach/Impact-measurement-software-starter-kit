/**
 * Namespaces should be defined prior to use.
 */
const namespaces = {
  '': 'http://ontology.eil.utoronto.ca/cids/cidsrep#',

  'owl': 'http://www.w3.org/2002/07/owl#',
  'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
  'xml': 'http://www.w3.org/XML/1998/namespace',
  'xsd': 'http://www.w3.org/2001/XMLSchema#',
  'schema': 'http://schema.org/',
  'foaf': 'http://xmlns.com/foaf/0.1/',
  'geo': 'http://www.w3.org/2003/01/geo/wgs84_pos#',
  'snmi': 'http://snmi#',
  'cp': 'http://helpseeker.co/compass#',
  'cids': 'http://ontology.eil.utoronto.ca/cids/cids#',
  'cidsrep': 'http://ontology.eil.utoronto.ca/cids/cidsrep#',
  'tove_org': 'http://ontology.eil.utoronto.ca/tove/organization#',
  'ic': 'http://ontology.eil.utoronto.ca/tove/icontact#',
  'cwrc': 'http://sparql.cwrc.ca/ontologies/cwrc#',
  'dc_terms': 'http://purl.org/dc/terms/',
  'tove_act': 'http://ontology.eil.utoronto.ca/tove/activity#',
  'dqv': 'http://www.w3.org/ns/dqv#',
  'time': 'http://www.w3.org/2006/time#',
  'dcat': "http://www.w3.org/ns/dcat#",
  'w3c_org': 'http://www.w3.org/ns/org#',
  'dc_elements': 'http://purl.org/dc/elements/1.1/',
  'iso21972': 'http://ontology.eil.utoronto.ca/ISO21972/iso21972#',
  'genprops': 'https://standards.iso.org/iso-iec/5087/-1/ed-1/en/ontology/GenericProperties#'
}

function swap(nameSpaces){
  const ret = {};
  for(const key in nameSpaces){
    ret[nameSpaces[key]] = key;
  }
  return ret;
}

const reverseNameSpaces = swap(namespaces)

module.exports = {namespaces, reverseNameSpaces}