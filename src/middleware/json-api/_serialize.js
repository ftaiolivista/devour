const _isPlainObject = require('lodash/isPlainObject')
const _includes = require('lodash/includes')
const _map = require('lodash/map')
const _forOwn = require('lodash/forOwn')

function collection (modelName, items) {
  if (!modelName) {
    return items
  }

  return items.map(item => {
    return resource.call(this, modelName, item)
  })
}

function resource (modelName, item) {
  if (!modelName) {
    return item
  }

  const model = this.modelFor(modelName)
  const options = model.options || {}
  const readOnly = options.readOnly || []
  const typeName = options.type || this.pluralize(modelName)
  const serializedAttributes = {}
  const serializedRelationships = {}
  const serializedResource = {}
  if (options.serializer) {
    return options.serializer.call(this, item)
  }
  _forOwn(model.attributes, (value, key) => {
    if (isReadOnly(key, readOnly)) {
      return
    }
    if (isRelationship(value)) {
      serializeRelationship(key, item[key], value, serializedRelationships)
    } else if (item[key] !== undefined) {
      serializedAttributes[key] = options.attributeSerializer && options.attributeSerializer[key]
        ? options.attributeSerializer[key](item[key])
        : item[key]
    }
  })

  serializedResource.type = typeName

  if (Object.keys(serializedAttributes).length > 0) {
    serializedResource.attributes = serializedAttributes
  }

  if (Object.keys(serializedRelationships).length > 0) {
    serializedResource.relationships = serializedRelationships
  }

  if (item.id) {
    serializedResource.id = item.id
  }

  if (item.meta) {
    serializedResource.meta = item.meta
  }

  if (item.links) {
    serializedResource.links = item.links
  }
  return serializedResource
}

function isReadOnly (attribute, readOnly) {
  return readOnly.indexOf(attribute) !== -1
}

function isRelationship (attribute) {
  return (_isPlainObject(attribute) && _includes(['hasOne', 'hasMany'], attribute.jsonApi))
}

function serializeRelationship (relationshipName, relationship, relationshipType, serializeRelationships) {
  if (relationshipType.jsonApi === 'hasMany' && relationship !== undefined) {
    serializeRelationships[relationshipName] = serializeHasMany(relationship, relationshipType.type)
  }
  if (relationshipType.jsonApi === 'hasOne' && relationship !== undefined) {
    serializeRelationships[relationshipName] = serializeHasOne(relationship, relationshipType.type)
  }
}

function serializeHasMany (relationships, type) {
  return {
    data: _map(relationships, (item) => {
      return { id: item.id, type: type || item.type, meta: item.meta }
    })
  }
}

function serializeHasOne (relationship, type) {
  if (relationship === null) {
    return { data: null }
  }
  return {
    data: { id: relationship.id, type: type || relationship.type, meta: relationship.meta }
  }
}

module.exports = {
  resource: resource,
  collection: collection
}
