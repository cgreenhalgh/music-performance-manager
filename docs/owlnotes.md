# OWL notes

Some thoughts about using OWL ontology to constrain UI. 

On hold for now in favour of initial hacks with JSON-LD compact form(s).

## OWL ontology stuff

Probably better to use class-specific GUI elements for non-trivial editing constraints, rather than trying to find a way to encode it in OWL.

Using `owl:FunctionProperty` and `owl:InverseFunctionProperty` to mark arity on properties (latter not applicable to DatatypeProperties). 

Planning to use custom `owl:Restriction`s to specify editability, etc. (`owl:onClass` and `owl:onProperty`).

## RDF to Angular mapping

Like database views!

Need to selectively unfold RDF structure to regular objects/arrays to underlie Angular UI.

RDF complex item -> JS Object with:
- `uri` - URI
- `types` - array of URI of rdf:type
- `minTypes` - minimual array of rdf:type
- `maxTypes` - maximal (transitively closed) array of rdf:type
- `properties` - map from predicate URI to `PropertyValue` objects

PropertyValue object is JS Object with:
- `predicate` - predicate URI (if not clear from context)
- `values` - array of values

PredicateInfo has:
- `uri`
- `minArity`, usually 0, 1 or undefined
- `maxArity`, usually 0, 1 or undefined
- `range`
- `domain`

PredicateDisplayInfo (may be for a sub-domain) has:
- `predicate` - URI
- `domain` - for this particular rule
- `useAsName` - boolean
- `display` - by default
- `advanced` 
- `defaultValue` ?
- `canCreate`
- `canEdit` 
- `canDelete`
vs `introspected` (?vs `inferred`)

Relation ?

ClassInfo has:
- `uri`
- `label` ?
- `subClassOf`
- `minSubClassOf` - minimal subClassOf relations
- `maxSubClassOf` - maximal (transitively closed) subClassOf relations
- `canCreate` - by user
- `canDelete` - by user

