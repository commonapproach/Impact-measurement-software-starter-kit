const {GraphDB, SPARQL, Helpers} = require("graphdb-utils");

async function getIndividualsInClass(req, res) {
  const instances = {};

  const query = `
    ${SPARQL.getSPARQLPrefixes()}
    select * 
    where { 
        ?s a <${SPARQL.getFullURI(req.params.class)}>, owl:NamedIndividual.
        OPTIONAL {?s rdfs:label ?label .}
        OPTIONAL {?s :hasOrganization [tove_org:hasName ?name] .} # For Service Provider: organization
        OPTIONAL {?s :hasVolunteer [foaf:familyName ?lastName] .} # For Service Provider: volunteer 
        OPTIONAL {?s foaf:familyName ?familyName. ?s foaf:givenName ?givenName. } # For Person/Client
        OPTIONAL {?s :hasType ?type . } # for needSatisfier
        FILTER (isIRI(?s))
    }`;
  console.log(query)

  // todo: volunteer will only give last name
  await GraphDB.sendSelectQuery(query, false, ({s, label, name, familyName, givenName, type, lastName}) => {
    if (label?.value || name?.value || (familyName?.value || givenName?.value) || type?.value || lastName?.value) {
      instances[s.id] = label?.value || name?.value || lastName?.value || type?.value || `${familyName?.value || ''}, ${givenName?.value || ''}`;
    } else {
      instances[s.id] = SPARQL.getPrefixedURI(s.id) || s.id;
    }
  });
  res.json(Helpers.sortObjectByKey(instances));
}


module.exports = {getIndividualsInClass}