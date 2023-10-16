const {hasAccess} = require("../../helpers/hasAccess");
const {Server400Error} = require("../../utils");
const {GDBCodeModel} = require("../../models/code");
const {GDBMeasureModel} = require("../../models/measure");
const {codeBuilder} = require("./codeBuilder");
const {Transaction} = require("graphdb-utils");

const fetchCodeHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchCode'))
      return await fetchCode(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchCode = async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    throw Server400Error('A code is needed');
  const code = await GDBCodeModel.findOne({_uri: uri}, {populates: ['iso72Value']});
  if (!code)
    throw Server400Error('No such code');
  code.iso72Value = code.iso72Value.numericalValue;
  return res.status(200).json({success: true, code});
}


const createCodeHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'createCode')){
      const {form} = req.body;
      if(await codeBuilder('interface', null, null,
        null, null, {}, {}, form)) {
        return res.status(200).json({success: true})
      }
    }
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    Transaction.rollback();
    next(e);
  }
};

const updateCodeHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'updateCode'))
      return await updateCode(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const updateCode = async (req, res) => {
  const {form} = req.body;
  const {uri} = req.params;
  if (!form || !form.definedBy || !form.specification || !form.identifier || !form.name || !form.description || !form.codeValue || !form.iso72Value){
    throw new Server400Error('Invalid input');
  }
  const code = await GDBCodeModel.findOne({_uri: uri}, {populates: ['iso72Value']});
  code.definedBy = form.definedBy;
  code.specification = form.specification
  code.identifier = form.identifier
  code.name = form.name
  code.description = form.description
  code.codeValue = form.codeValue
  code.iso72Value.numericalValue = form.iso72Value
  await code.save();
  return res.status(200).json({success: true});
}

async function createCode(req, res){
  const {form} = req.body;
  if (!form || !form.definedBy || !form.specification || !form.identifier || !form.name || !form.description || !form.codeValue || !form.iso72Value){
    throw new Server400Error('Invalid input');
  }
  const code = GDBCodeModel({
    definedBy: form.definedBy,
    specification: form.specification,
    identifier: form.identifier,
    name: form.name,
    description: form.description,
    codeValue: form.codeValue,
    iso72Value: GDBMeasureModel({
      numericalValue: form.iso72Value
    })
  }, {uri: form.uri});
  await code.save();
  return res.status(200).json({success: true});


}

module.exports = {
  createCodeHandler, fetchCodeHandler, updateCodeHandler
}