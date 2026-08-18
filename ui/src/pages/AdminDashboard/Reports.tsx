import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import DashboardPage from '../../components/Dashboard/DashboardPage';
import { Checkbox } from '../../components/Input';
import PageLoading from '../../components/PageLoading';
import SimpleFeed, { SimpleFeedItem } from '../../components/SimpleFeed';
import { TableRow } from '../../components/Table';
import TimeAgo from '../../components/TimeAgo';
import { mfetchjson } from '../../helper';
import { useLoading } from '../../hooks';
import { Comment, Report } from '../../serverTypes';
import { snackAlert, snackAlertError } from '../../slices/mainSlice';
import { Post } from '../../slices/postsSlice';

interface ReportsState {
  reports: Report[] | null;
  limit: number;
  page: number;
}

async function fetchReports(page: number = 1, limit: number = 20): Promise<ReportsState> {
  return mfetchjson(`/api/admin/reports?page=${page}&limit=${limit}`);
}

export default function Reports() {
  const [loading, setLoading] = useLoading('loading');
  const [reportsState, setReportsState] = useState<ReportsState>({ reports: null, limit: 20, page: 1 });

  const dispatch = useDispatch();
  useEffect(() => {
    const f = async () => {
      try {
        const res = await fetchReports();
        setReportsState(res);
        setLoading('loaded');
      } catch (error) {
        dispatch(snackAlertError(error));
        setLoading('error');
      }
    };
    f();
  }, [dispatch, setLoading]);

  const fetchNextReports = async () => {
    try {
      const res = await fetchReports(reportsState.page + 1, reportsState.limit);
      if (res.reports && res.reports.length > 0) {
        setReportsState((prev) => ({
          reports: [...(prev.reports || []), ...(res.reports || [])],
          limit: res.limit,
          page: res.page,
        }));
      }
    } catch (error) {
      dispatch(snackAlertError(error));
    }
  };

  const resolvedInProgress = useRef<{ [key: number]: boolean }>({});

  const handleResolvedChange = async (report: Report, checked: boolean) => {
    if (resolvedInProgress.current[report.id]) {
      return;
    }

    try {
      resolvedInProgress.current[report.id] = true;
      const updated = await mfetchjson(`/api/admin/reports/${report.id}`, {
        method: 'PUT',
        body: JSON.stringify({ resolved: checked }),
      });
      setReportsState((prev) => ({
        ...prev,
        reports: prev.reports
          ? prev.reports.map((r) => (r.id === report.id ? (updated as Report) : r))
          : null,
      }));
      dispatch(snackAlert(checked ? 'Report marked as resolved' : 'Report marked as unresolved'));
    } catch (error) {
      dispatch(snackAlertError(error));
    } finally {
      resolvedInProgress.current[report.id] = false;
    }
  };

  const handleRenderItem = (item: Report) => {
    const report = item;
    let contentLink = '';
    let contentText = '(target deleted)';

    if (report.target) {
      if (report.type === 'post') {
        const post = report.target as Post;
        contentLink = `/${post.communityName}/post/${post.publicId}`;
        contentText = post.title || '(no title)';
      } else {
        const comment = report.target as Comment;
        contentLink = `/${comment.communityName}/post/${comment.postPublicId}/${comment.id}`;
        contentText = comment.body.substring(0, 100) + (comment.body.length > 100 ? '...' : '');
      }
    }

    return (
      <TableRow columns={6}>
        <div className="table-column">{report.reason}</div>
        {contentLink ? (
          <Link className="table-column" to={contentLink}>
            {contentText}
          </Link>
        ) : (
          <div className="table-column">{contentText}</div>
        )}
        <div className="table-column">{report.type}</div>
        <TimeAgo className="table-column" time={report.createdAt} />
        <div className="table-column">
          <Checkbox
            variant="switch"
            label=""
            checked={Boolean(report.dealtAt)}
            onChange={(e) => handleResolvedChange(report, e.target.checked)}
          />
        </div>
      </TableRow>
    );
  };

  const handleRenderHead = () => {
    return (
      <TableRow columns={6} head>
        <div className="table-column">Reason</div>
        <div className="table-column">Reported content</div>
        <div className="table-column">Type</div>
        <div className="table-column">Reported at</div>
        <div className="table-column">Resolved</div>
      </TableRow>
    );
  };

  if (loading !== 'loaded') {
    return <PageLoading />;
  }

  const feedItems: SimpleFeedItem<Report>[] = [];
  if (reportsState.reports) {
    reportsState.reports.forEach((report) => feedItems.push({ item: report, key: report.id.toString() }));
  }

  return (
    <DashboardPage className="dashboard-page-reports document" title="Reports">
      <SimpleFeed
        className="table"
        items={feedItems}
        onRenderItem={handleRenderItem}
        onRenderHead={handleRenderHead}
      />
      {reportsState.reports && reportsState.reports.length > 0 && (
        <Button className="is-more-button" onClick={fetchNextReports}>
          More
        </Button>
      )}
    </DashboardPage>
  );
}
