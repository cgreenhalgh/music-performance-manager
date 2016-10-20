# Design Notes

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

## Screen Manager

Client application asserts 'BrowserView' to the server. Server signal no longer active on disconnect. Server collates and reports to registered manager(s). Client optionally specifies name (in URL parameter). BrowserView itself is new temporary ID (GUID?). 

Manager registers to get BrowserView assertions (active and inactive). Manager shows BrowserViews. 

Manager allows ScreenTemplates and Scenes to be created and edited, including Frames and ScreenSplits. Allows ScreenApps to be created and edited. Allows ScreenApps to be associated with Frames. 

Manager allows ScreenTemplates to be applied to BrowserViews, and sends these and any changes in configuration to server to send to active BrowserViews.

Manager allows ScreenTemplates and Scenes to be saved and loaded. 
