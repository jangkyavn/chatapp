﻿"use strict";

//elements
var conversation = $('.conversation');
var lastSentMessages = $('.messages--sent:last-child');
var lastReceivedMessages = $('.messages--received:last-child');
var textbar = $('.text-bar__field input');
var textForm = $('#form-message');
var user = $('#hidUserName');
var loadMoreContainer = $('#loadMoreContainer');

var scrollTop = $(window).scrollTop();

var Message = {
    cachedObj: {
        pageIndex: 1
    },
    currentText: '',
    init: function () {
        $('.zoom-image').magnificPopup({
            type: 'image'
        });

        var base = this;
        base.initSignalR();

        conversation.html('');
        base.loadMessages(false);
        base.registerEvents();
    },
    initSignalR: function () {
        var chat = $.connection.chatHub;
        chat.client.receiveMessage = function (message) {
            var base = Message;
            if (user.val() === message.SenderName && localStorage.getItem('receiver') === message.ReceiverName ||
                user.val() === message.ReceiverName && localStorage.getItem('receiver') === message.SenderName) {
                if (message.IsStartDate) {
                    conversation.append(`<div class='messages messages--datecreated'>
                                                    ${moment(message.DateCreated).format('LL')}
                                                </div>`);
                }

                if (user.val() === message.SenderName) {
                    base.createGroup(true);
                    base.createMessage(true, message);

                    setTimeout(function () {
                        base.scrollDown();
                    }, 50);
                } else {
                    var isBottom = base.isBottom();

                    base.createGroup(false);
                    base.createMessage(false, message);

                    if (isBottom) {
                        setTimeout(function () {
                            base.scrollDown();
                        }, 50);
                    }
                }
            }
        };

        $.connection.hub.start().done(function () {
            var base = Message;
            textForm.on('submit', function () {
                event.preventDefault();
                base.saveText();
                if (base.currentText !== '') {
                    chat.server.sendMessage(localStorage.getItem('receiver'), base.currentText);
                }
            });
        });
    },
    saveText: function () {
        var base = this;
        base.currentText = textbar.val();
        textbar.val('');
    },
    createMessage: function (isSender, message) {
        var base = this;
        if (isSender) {
            if (message.ContentType === 'text') {
                lastSentMessages.append($('<div/>')
                    .addClass('message')
                    .text(message.Content));
            } else if (message.ContentType === 'image') {
                lastSentMessages.append($('<div/>')
                    .addClass('message-image')
                    .html(`<a class="zoom-image" href="/Uploaded/${message.Content}">
                                <img class="msg-image" style="width: 30%;" src="/Uploaded/${message.Content}" />
                           </a>`));
            } else {
                lastSentMessages.append($('<div/>')
                    .addClass('message-file')
                    .html(`<a href="/Uploaded/${message.Content}" download="${message.Content}">${message.Content}</a>`));
            }
        } else {
            if (message.ContentType === 'text') {
                lastReceivedMessages.append($('<div/>')
                    .addClass('message')
                    .text(message.Content));
            } else if (message.ContentType === 'image') {
                lastReceivedMessages.append($('<div/>')
                    .addClass('message-image')
                    .html(`<a class="zoom-image" href="/Uploaded/${message.Content}">
                                <img class="msg-image" style="width: 30%;" src="/Uploaded/${message.Content}" />
                           </a>`));
            } else {
                lastReceivedMessages.append($('<div/>')
                    .addClass('message-file')
                    .html(`<a href="/Uploaded/${message.Content}" download="${message.Content}">${message.Content}</a>`));
            }
        }

        $('.zoom-image').magnificPopup({
            items: {
                src: $(`<img src="/Uploaded/${message.Content}" class='preview-image' />
                        <a class="download" href="/Uploaded/${message.Content}" download="${message.Content}">
                            <i class="fa fa-download" aria-hidden="true"></i> Tải xuống
                        </a>`),
                type: 'inline'
            },
            closeOnBgClick: false,
            closeBtnInside: false
        });
    },
    createGroup: function (isSender) {
        if (isSender) {
            if (conversation.html()) {
                if ($('.messages:last-child').hasClass('messages--received') ||
                    $('.messages:last-child').hasClass('messages--datecreated')) {
                    conversation.append($('<div/>')
                        .addClass('messages messages--sent'));
                    lastSentMessages = $('.messages--sent:last-child');
                }
            } else {
                conversation.append($('<div/>')
                    .addClass('messages messages--sent'));
                lastSentMessages = $('.messages--sent:last-child');
            }
        } else {
            if (conversation.html()) {
                if ($('.messages:last-child').hasClass('messages--sent') ||
                    $('.messages:last-child').hasClass('messages--datecreated')) {
                    conversation.append($('<div/>')
                        .addClass('messages messages--received'));
                    lastReceivedMessages = $('.messages--received:last-child');
                }
            } else {
                conversation.append($('<div/>')
                    .addClass('messages messages--received'));
                lastReceivedMessages = $('.messages--received:last-child');
            }
        }
    },
    scrollDown: function () {
        var base = this;
        //conversation.scrollTop(conversation[0].scrollHeight);
        conversation.stop().animate({
            scrollTop: conversation[0].scrollHeight
        }, 500);
    },
    isBottom: function () {
        var current = Math.round(conversation.scrollTop() + conversation.innerHeight(), 10);
        var total = Math.round(conversation[0].scrollHeight, 10);
        return total === current ? true : false;
    },
    loadMoreMessages: function (item) {
        var base = Message;

        if (item.IsStartDate) {
            loadMoreContainer.append(`<div class='messages messages--datecreated'>
                                                    ${moment(item.DateCreated).format('LL')}
                                                </div>`);
        }

        if (user.val() === item.SenderName) {
            if (loadMoreContainer.html()) {
                if (loadMoreContainer.find('.messages:last-child').hasClass('messages--received') ||
                    loadMoreContainer.find('.messages:last-child').hasClass('messages--datecreated')) {
                    loadMoreContainer.append($('<div/>')
                        .addClass('messages messages--sent'));
                }
            } else {
                loadMoreContainer.append($('<div/>')
                    .addClass('messages messages--sent'));
            }

            if (item.ContentType === 'text') {
                loadMoreContainer.find('.messages--sent:last-child')
                    .append($('<div/>')
                        .addClass('message')
                        .text(item.Content));
            } else if (item.ContentType === 'image') {
                loadMoreContainer.find('.messages--sent:last-child')
                    .append($('<div/>')
                        .addClass('message-image')
                        .html(`<a class="zoom-image" href="#" data-content="${item.Content}">
                                <img class="msg-image" style="width: 30%;" src="/Uploaded/${item.Content}" />
                           </a>`));
            } else {
                loadMoreContainer.find('.messages--sent:last-child')
                    .append($('<div/>')
                        .addClass('message-file')
                        .html(`<a href="/Uploaded/${item.Content}" download="${item.Content}">${item.Content}</a>`));
            }
        } else {
            if (loadMoreContainer.html()) {
                if (loadMoreContainer.find('.messages:last-child').hasClass('messages--sent') ||
                    loadMoreContainer.find('.messages:last-child').hasClass('messages--datecreated')) {
                    loadMoreContainer.append($('<div/>')
                        .addClass('messages messages--received'));
                }
            } else {
                loadMoreContainer.append($('<div/>')
                    .addClass('messages messages--received'));
            }

            if (item.ContentType === 'text') {
                loadMoreContainer.find('.messages--received:last-child')
                    .append($('<div/>')
                        .addClass('message')
                        .text(item.Content));
            } else if (item.ContentType === 'image') {
                loadMoreContainer.find('.messages--received:last-child')
                    .append($('<div/>')
                        .addClass('message-image')
                        .html(`<a class="zoom-image" href="#" data-content="${item.Content}">
                                <img class="msg-image" style="width: 30%;" src="/Uploaded/${item.Content}" />
                           </a>`));
            } else {
                loadMoreContainer.find('.messages--received:last-child')
                    .append($('<div/>')
                        .addClass('message-file')
                        .html(`<a href="/Uploaded/${item.Content}" download="${item.Content}">${item.Content}</a>`));
            }
        }
    },
    loadMessages: function (isloadMore = false) {
        var receiverStorage = localStorage.getItem('receiver');

        if (!receiverStorage) {
            $('.user-row').removeClass('user-message-active');
            var firstUser = $('.user-row:first-child');
            firstUser.addClass('user-message-active');
            localStorage.setItem('receiver', firstUser.data('user'));
        } else {
            $('.user-row').each(function () {
                var userName = $(this).data('user');
                if (userName === receiverStorage) {
                    $('.user-row').removeClass('user-message-active');
                    $(this).addClass('user-message-active');
                    return false;
                }
            });
        }

        var base = this;
        $.ajax({
            url: '/Home/GetMessages',
            type: 'GET',
            data: {
                receiver: receiverStorage,
                pageIndex: base.cachedObj.pageIndex++
            },
            success: function (response) {
                console.log(response);
                if (response.length > 0) {
                    var html = '';
                    $.each(response, function (idx, item) {
                        if (isloadMore === true) {
                            base.loadMoreMessages(item);
                        } else {
                            if (item.IsStartDate) {
                                conversation.append(`<div class='messages messages--datecreated'>
                                                    ${moment(item.DateCreated).format('LL')}
                                                </div>`);
                            }

                            if (user.val() === item.SenderName) {
                                base.createGroup(true);
                                base.createMessage(true, item);
                            } else {
                                base.createGroup(false);
                                base.createMessage(false, item);
                            }
                        }
                    });

                    if (isloadMore) {
                        var scrollarea = document.getElementById('conversation');
                        var lastScrollHeight = scrollarea.scrollHeight;
                        setTimeout(function () {
                            conversation.prepend(loadMoreContainer.html());
                            scrollarea.scrollTop += (scrollarea.scrollHeight - lastScrollHeight);
                        }, 200);
                    } else {
                        base.scrollDown();
                    }
                }
            }
        });
    },
    registerEvents: function () {
        var base = this;

        $('.user-row').on('click', function (e) {
            e.preventDefault();
            var receiver = $(this).data('user');
            if (receiver === localStorage.getItem('receiver')) {
                return false;
            }

            localStorage.setItem('receiver', receiver);
            base.cachedObj.pageIndex = 1;

            $('.user-row').removeClass('user-message-active');
            $(this).addClass('user-message-active');

            loadMoreContainer.html('');
            conversation.html('');
            base.loadMessages(false);
        });

        conversation.scroll(function () {
            if (conversation.scrollTop() === conversation.height() - conversation.height()) {
                base.loadMessages(true);
            }
        });

        $('body').on('click', '.zoom-image', function (e) {
            e.preventDefault();
            var content = $(this).data('content');
            $('.zoom-image').magnificPopup({
                items: {
                    src: $(`<img src="/Uploaded/${content}" class='preview-image' />
                        <a class="download" href="/Uploaded/${content}" download="${content}">
                            <i class="fa fa-download" aria-hidden="true"></i> Tải xuống
                        </a>`),
                    type: 'inline'
                },
                closeOnBgClick: false,
                closeBtnInside: false
            });
        });

        $('#btn-send-file').on('click', function (e) {
            e.preventDefault();
            $('#fileUpload').val(null);
            $('#fileUpload').click();
        });

        $('#fileUpload').on('change', function () {
            var fileUpload = $(this).get(0);
            var files = fileUpload.files;
            var data = new FormData();
            for (var i = 0; i < files.length; i++) {
                data.append(files[i].name, files[i]);
            }

            $.ajax({
                url: '/Home/Upload?receiverName=' + localStorage.getItem('receiver'),
                type: 'POST',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                success: function (response) {
                    ////
                }
            });
        });
    }
};

var newMessage = Object.create(Message);
newMessage.init();