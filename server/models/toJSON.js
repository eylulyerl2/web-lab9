// Shared toJSON options for every schema: expose "id" as a string and hide "_id" and "__v".
export const toJSONOptions = {
  virtuals: false,
  versionKey: false,
  transform(doc, ret) {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
};