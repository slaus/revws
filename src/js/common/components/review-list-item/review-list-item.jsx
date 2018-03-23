// @flow

import React from 'react';
import classnames from 'classnames';
import type { GradingShapeType, ReviewType, ShapeColorsType } from 'common/types';
import { F, isNil } from 'ramda';
import { hasRatings, averageGrade } from 'common/utils/reviews';
import Grading from 'common/components/grading/grading';
import ReplyIcon from 'material-ui-icons/Reply';
import styles from './review-list-item.less';
import Textarea from 'common/components/text-area/text-area';
import Button from 'material-ui/Button';

type Props = {
  shopName: string,
  shape: GradingShapeType,
  colors?: ShapeColorsType,
  shapeSize: number,
  review: ReviewType,
  onEdit: (ReviewType)=>void,
  onSaveReply?: (?string)=>void,
  onDelete: (ReviewType)=>void,
  onVote: (ReviewType, 'up' | 'down')=>void,
  onReport: (ReviewType)=>void
};

type State = {
  editReply: ?string
}

class ReviewListItem extends React.PureComponent<Props, State> {
  static displayName = 'ReviewListItem';

  static defaultProps = {
    onEdit: F,
    onDelete: F,
    onVote: F,
    onReport: F
  }

  state = {
    editReply: null
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.state.editReply && this.props.review.reply != nextProps.review.reply) {
      this.stopEditReply();
    }
  }

  render() {
    const { colors, shape, shapeSize, onReport, onEdit, onDelete, onVote, review } = this.props;
    const { displayName, date, title, underReview, verifiedBuyer, content, canVote, canReport, canEdit, canDelete } = review;
    const classes = classnames('revws-review', 'row', 'no-gutter', {
      'revws-review-under-review': underReview,
      'revws-verified-buyer': verifiedBuyer
    });

    return (
      <div className={classes}>
        <div className="col-sm-3 col-md-2">
          <div className="revws-review-author">
            <div className="revws-review-author-name">{ displayName }</div>
            {verifiedBuyer && <div className="revws-verified-buyer-badge">{__("Verified purchase")}</div>}
            { hasRatings(review) ? (
              <Grading
                grade={averageGrade(review)}
                shape={shape}
                type={'product'}
                size={shapeSize}
                colors={colors}
              />
            ) : undefined}
            <div className="revws-review-date">{formatDate(date)}</div>
          </div>
        </div>

        <div className="col-sm-9 col-md-10">
          <div className="revws-review-details">
            <p className="revws-review-title">
              { title }
            </p>
            {underReview && (
              <div className="revws-under-review">{__("This review hasn't been approved yet")}</div>
            )}
            <p className="revws-review-content">{ this.renderContent(content) }</p>
            <div className="revws-actions">
              {canVote && (
                <div className="revws-action revws-useful">
                  {__('Was this comment useful to you?')}
                  <a className="btn btn-xs btn-link" onClick={() => onVote(review, 'up')}>
                    <i className="icon icon-thumbs-up"></i> {__('Yes')}
                  </a>
                  <a className="btn btn-xs btn-link" onClick={() => onVote(review, 'down')}>
                    <i className="icon icon-thumbs-down"></i> {__('No')}
                  </a>
                </div>
              )}
              {canReport && (
                <div className="revws-action revws-report">
                  <a className="btn btn-xs btn-link" onClick={() => onReport(review)}>
                    <i className="icon icon-flag"></i> {__('Report abuse')}
                  </a>
                </div>
              )}
              {canEdit && (
                <div className="revws-action revws-edit">
                  <a className="btn btn-xs btn-link" onClick={() => onEdit(review)}>
                    <i className="icon icon-edit"></i> {__('Edit review')}
                  </a>
                </div>
              )}
              {canDelete && (
                <div className="revws-action revws-delete">
                  <a className="btn btn-xs btn-link" onClick={() => onDelete(review)}>
                    <i className="icon icon-remove"></i> {__('Delete review')}
                  </a>
                </div>
              )}
            </div>
            { this.renderReplies() }
          </div>
        </div>
      </div>
    );
  }

  renderReplies = () => {
    const { review, onSaveReply } = this.props;
    const { editReply } = this.state;
    if (! isNil(editReply)) {
      return this.renderEditReply(editReply || '');
    }
    if (review.reply) {
      return this.renderReply(review.reply);
    }
    if (onSaveReply) {
      return this.renderReplyPlaceholder();
    }
    return null;
  }

  renderReply = (reply: string) => {
    const shopName = this.props.shopName;
    const canEdit = !!this.props.onSaveReply;
    const clazz = classnames("revws-reply", {
      [ styles.editable ]: canEdit
    });
    const onClick = canEdit ? this.startEditReply : null;
    return (
      <div className="revws-replies">
        <div className={clazz} onClick={onClick}>
          <div className="revws-reply-title">
            {__('Reply from %s:', shopName)}
          </div>
          <div className="revws-reply-content">
            { this.renderContent(reply) }
          </div>
        </div>
      </div>
    );
  }

  renderEditReply = (reply: string) => {
    return (
      <div className="revws-replies">
        <Textarea
          value={reply}
          label={__('Your answer')}
          placeholder={__('Write your answer')}
          onChange={e => this.setState({ editReply: e.target.value })} />
        <div className={styles.margin}>
          <Button onClick={this.stopEditReply}>
            {__('Cancel')}
          </Button>
          <Button color='accent' onClick={this.saveReply}>
            {__('Save')}
          </Button>
        </div>
      </div>
    );
  }

  renderReplyPlaceholder = () => {
    return (
      <div className="revws-replies">
        <div className={styles.reply} onClick={this.startEditReply}>
          <ReplyIcon />
          {__('Click here to reply')}
        </div>
      </div>
    );
  }

  startEditReply = () => {
    const review = this.props.review;
    this.setState({ editReply: review.reply || '' });
  }

  stopEditReply = () => {
    this.setState({ editReply: null });
  }

  saveReply = () => {
    const { onSaveReply } = this.props;
    if (onSaveReply) {
      const reply = this.state.editReply || null;
      this.stopEditReply();
      onSaveReply(reply);
    }
  }

  renderContent = (content: ?string) => {
    if (! content) {
      return null;
    }
    const split = content.split(/\r?\n/);
    const cnt = split.length;
    if (cnt <= 1) {
      return content;
    }
    const ret = [];
    for (var i=0; i<cnt; i++) {
      const item = split[i];
      ret.push(<span key={i}>{item}</span>);
      if (i != cnt-1) {
        ret.push(<br key={'br-'+i} />);
      }
    }
    return ret;
  }
}

const formatDate = (date: Date): string => {
  var month = pad(date.getMonth()+1);
  var day = pad(date.getDate());
  var year = date.getFullYear();
  return month + "/" + day + "/" + year;
};

const pad = (value) => ('00'+value).substr(-2);

export default ReviewListItem;
