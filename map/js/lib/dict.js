function defaultTo(dict, key, value) {
  if(!(key in dict)) {
    dict[key] = value;
  }
}
