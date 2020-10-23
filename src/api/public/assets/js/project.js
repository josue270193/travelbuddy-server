let full_text = '';
let text_file_all_text = [];
let page_num = 0;
let selected_text = '';
let training_datas = [];
let training_data = {};
let entities = [];
const class_names = [];

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getFilename(myFile, label) {
  if (myFile.files.length > 0) {
    const file = myFile.files[0];
    const filename = file.name;
    $(label).text(filename);
  } else {
    $(label).text('Seleccione un archivo .txt...');
  }
}

function clearSelection() {
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  } else if (document.selection) {
    document.selection.empty();
  }
}

function commit() {
  full_text = $('#editor').text();
}

function addClass(classname) {
  class_names.push(classname);
  $('.classes').append(
    '<div class="row pdn"><div class="col-9"><button class="class" style="background-color:' +
      getRandomColor() +
      '"><span>' +
      classname +
      '</span></button></div><div class="col-3"><button class="btn pull-right delete_btn"><i class="fa fa-trash"></i></button></div></div>',
  );
}

function arrayEquals(a1, a2) {
  if (a1.length !== a2.length) {
    return false;
  }
  for (let i = 0; i < a1.length; i++) {
    if (a1[i] !== a2[i]) {
      return false;
    }
  }
  return true;
}

function arrayIndexOf(objArr, arr) {
  let index = 0;
  for (index = 0; index < arr.length; index++) {
    if (arrayEquals(arr[index], objArr)) {
      break;
    }
  }
  if (index >= arr.length) {
    return -1;
  }
  return index;
}

function updateText() {
  $('#doctext').text('>>> ' + text_file_all_text.slice(page_num, text_file_all_text.length).join('\n\n'));
  $('#doccount').text(text_file_all_text.length - 1 - page_num);
  $('#editor').text(text_file_all_text[page_num]);
}

$('#addclass').click(function () {
  classname = $('input').val();
  if (class_names.indexOf(classname) !== -1) {
    alert('Class names is already saved');
    $('input').val('');
    return;
  }
  addClass(classname);
  $('input').val('');
});

$('input').keypress((e) => {
  var key = e.which;
  if (key === 13) {
    $('#addclass').click();
    return false;
  }
});

$('.classes').on('click', '.class', function () {
  commit();
  let selection = window.getSelection();
  selected_text = selection.toString();
  if (selected_text === '') {
    alert('Seleccione un texto para etiquetar');
    return;
  }

  let range = selection.getRangeAt(0);
  let priorRange = range.cloneRange();
  priorRange.selectNodeContents(document.getElementById('editor'));
  priorRange.setEnd(range.startContainer, range.startOffset);
  let start = priorRange.toString().length;
  let end = start + (selection + '').length;
  if (start < 0 || end < 0) {
    alert('Seleccione una entidad dentro del texto');
    return;
  }

  let ent;
  for (let i = 0; i < entities.length; i++) {
    ent = entities[i];
    if ((start >= ent[0] && start < ent[1]) || (end > ent[0] && end <= ent[1])) {
      clearSelection();
      alert('Anotaciones solapadas');
      return;
    }
  }

  let entity = [start, end, $(this).text()];
  entities.push(entity);

  let color_rgb = $(this).css('background-color');
  let tag = document.createElement('span');
  tag.setAttribute('start_idx', start);
  tag.setAttribute('end_idx', end);
  tag.setAttribute('class', 'annotation');
  tag.setAttribute('annotation', $(this).text());
  tag.setAttribute('style', 'background-color: ' + color_rgb + ';');

  range.surroundContents(tag);

  clearSelection();
  console.log('+ added: ' + entity);
});

$('#editor').on('click', '.annotation', function () {
  let annotation = $(this);
  let start = parseInt(annotation.attr('start_idx'));
  let end = parseInt(annotation.attr('end_idx'));
  let label = annotation.attr('annotation');

  $(this).contents().unwrap();
  let entity = [start, end, label];

  let index = arrayIndexOf(entity, entities);
  if (index > -1) {
    entities.splice(index, 1);
  }
});

$('#prev').click(function () {
  let p;
  if (page_num > 0) {
    page_num--;
    updateText();

    entities = [];
    full_text = '';

    p = training_datas.pop();
  } else {
    alert('Se encuentra en el comienzo');
  }
});

$('#next').click(function () {
  page_num++;
  updateText();

  if (page_num < text_file_all_text.length - 1) {
    training_data = {};
    training_data['content'] = full_text;
    training_data['entities'] = entities;

    training_datas.push(training_data);

    entities = [];
    full_text = '';
  } else {
    page_num--;
    alert('Final del archivo');
  }
});

$('#complete').click(function () {
  if (entities.length > 0 && full_text !== '') {
    training_data = {};
    training_data['content'] = full_text;
    training_data['entities'] = entities;

    training_datas.push(training_data);
  }

  if ('Blob' in window) {
    var fileName = prompt('Ingrese el nombre del archivo a guardar(.json)', 'Data.json');
    if (fileName != null) {
      var jsonText = JSON.stringify(training_datas);
      var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonText);
      var dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute('href', dataStr);
      dlAnchorElem.setAttribute('download', fileName);
      dlAnchorElem.click();
      training_datas = [];
      page_num = 0;

      entities = [];
      full_text = '';
    }
  } else {
    alert('El explorador no soporta HTML5.');
  }
});

$('.classes').on('click', '.delete_btn', function () {
  let tt;
  if (confirm('Esta seguro que desea eliminar la entidad?')) {
    tt = $('.delete_btn').parent().parent().text();
    class_names.splice(class_names.indexOf(tt), 1);
    $(this).parent().parent().remove();
  }
});

$('#upload').click(function () {
  const fileInput = $('#validatedCustomFile');
  const input = fileInput.get(0);
  if (input.files.length > 0) {
    const textFile = input.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      text_file_all_text = e.target.result.split('\n');
      $('#editor').text(text_file_all_text[page_num]);

      page_num = 0;
      updateText();
    };
    reader.readAsText(textFile);
  }
});

$('#uploadAnnotator').click(function () {
  const fileInput = $('#validatedAnnotatorFile');
  const input = fileInput.get(0);
  if (input.files.length > 0) {
    const textFile = input.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      let listEntityName = e.target.result.split('\n');
      listEntityName.forEach((item) => addClass(item));
    };
    reader.readAsText(textFile);
  }
});

$(document).ready(function () {
  $('textarea').attr('readonly', false);
  $('#fileUpload').click();
});
